import Autocomplete from '../vendors/autocomplete'
import ajax from '../libs/ajax'
import Poi from '../mapbox/poi'
import IconManager from '../adapters/icon_manager'
import nconf from '@qwant/nconf-getter'
import Store from '../adapters/store'
import PanelManager from '../proxies/panel_manager'
import {layout} from '../../config/constants.yml'

const serviceConfigs = nconf.get().services
const geocoderUrl = serviceConfigs.geocoder.url
const store = new Store()

function SearchInput(tagSelector) {
  this.pois = []
  this.poi = null

  new Autocomplete({
    selector : tagSelector,
    minChars : 1,
    cachePrefix : false,
    delay : 100,
    width:'650px',
    onUpdate : (e, poi) => {
      this.poi = poi
    },
    source : (term, suggest) => {
      /*
        https://gis.stackexchange.com/questions/8650/measuring-accuracy-of-latitude-and-longitude/8674#8674
        this post is about correlation between gps coordinates decimal count & real precision unit
        110m = 3 decimals
       */
      const HUNDRED_METERS_PRECISION = 1000
      let bbox = toAccuracy(window.map.bbox(), HUNDRED_METERS_PRECISION)
      /* 'bbox' is currently not used by the geocoder, it' will be used for the telemetry. */
      const suggestPromise = ajax.query(geocoderUrl, {q: term, bbox : bbox})
      const suggestHistoryPromise = getHistory(term)
      Promise.all([suggestPromise, suggestHistoryPromise]).then((responses) => {
        this.pois = buildPoi(responses[0])
        let historySuggestData = responses[1]
        historySuggestData = historySuggestData.map((historySuggest) => {
          let poi = Poi.storeLoad(historySuggest)
          poi.fromHistory = true
          return poi
        })
        this.pois = this.pois.concat(historySuggestData)
        suggest(this.pois, term)
      })
    },
    renderItem : ({id, name, fromHistory, className, subClassName, addressLabel}) => {
      let icon = IconManager.get({className : className, subClassName : subClassName})
      return `
<div class="autocomplete_suggestion${fromHistory ? ' autocomplete_suggestion--history' : ''}" data-id="${id}" data-val="${name}">
  <div style="color:${icon ? icon.color : ''}" class="autocomplete-icon ${icon ? `icon icon-${icon.iconClass}` : 'icon-location'}"></div>
  ${name}
  ${addressLabel ? `<span class="autocomplete_address">${addressLabel}</span>` : ''}
</div>
`
    },
    onSelect : (e, term, item) => {
      e.preventDefault()
      const itemId = item.getAttribute('data-id')
      let poi = this.pois.find(poi => poi.id === itemId)
      select(poi)
    }
  })
}

async function select(selectedPoi) {
  if(selectedPoi) {
    console.log(selectedPoi)
    fire('fit_map', selectedPoi)
    fire('map_mark_poi', selectedPoi)
    if(selectedPoi.poi_type === 'poi') {
      PanelManager.loadPoiById(selectedPoi.id)
    }
  }
}

function buildPoi(response) {
  return response.features.map((feature) => {
    return Poi.geocoderLoad(feature)
  })
}

function toAccuracy(bbox, accuracy) {
  const s = Math.floor(bbox.getSouth() * accuracy) / accuracy //v -> floor
  const w = Math.floor(bbox.getWest() * accuracy) /accuracy //< -> floor
  const n = Math.ceil(bbox.getNorth() * accuracy) / accuracy //^ -> ceil
  const e = Math.ceil(bbox.getEast() * accuracy) / accuracy //> ->  ceil

  return [[s,w],[n,e]] //sw / ne
}

async function getHistory(term) {
  return new Promise((resolve) => {
    store.getPrefixes(term).then((result) => {
      resolve(result)
    }).catch(() => {
      resolve([])
    })
  })
}

export default SearchInput

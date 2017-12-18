import FavoritePanelView from 'dot-loader!../views/favorites_panel.dot'
import Panel from '../libs/panel'
import Poi from '../mapbox/poi'

function Favorite() {
  this.active = false
  this.favoritePois = []

  listen('favorite_loaded', (storeData) => {
    this.favoritePois = Object.keys(storeData).map((mapPoint) => {
      return Poi.load(storeData[mapPoint])
    })
    this.panel.render()
  })

  listen('store_poi', (poi) => {
    this.add(poi)
  })

  this.panel = new Panel(this, FavoritePanelView, 'favorites_panel')
}

Favorite.prototype.toggle = function() {
  if(this.active) {
    this.panel.animate(0.4, '.favorites_panel', {left : '-280px'}).then(() => {
      this.active = false
    })
  } else {
    this.panel.animate(0.4, '.favorites_panel', {left : 0}).then(() => {
      this.active = true
    })
  }
}

Favorite.prototype.go = function(poi) {
  fire('mark_poi', poi)
  if(poi.bbox) {
    fire('fit_bounds', poi)
  } else {
    fire('fly_to', poi)
  }
  this.panel.animate(0.4, '.favorites_panel', {left : '-280px'}).then(() => {
    this.active = false
  })
}

Favorite.prototype.add = function(poi) {
  this.favoritePois.push(poi)
  const renderPromise = this.panel.render()
  renderPromise.then(()=>{

  })
}

Favorite.prototype.del = function(poi) {
  this.favoritePois = this.favoritePois.filter((favorite) => {
    if(favorite === poi) {
      fire('del_poi', poi)
      return false
    }
    return true
  })
  this.panel.render()
}

export default Favorite

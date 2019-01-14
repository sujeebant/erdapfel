import {Map, Marker, LngLat, LngLatBounds, setRTLTextPlugin} from 'mapbox-gl--ENV'
const ALTERNATE_ROUTE_COLOR = '#c8cbd3'
const MAIN_ROUTE_COLOR = '#4ba2ea'


export default class SceneDirection {
  constructor(map) {
    this.map = map
    this.routeSetCounter = 0
    this.routeCounter = 0
    this.routes = []

    listen('set_route', ({routes, vehicle, start, end}) => {
      this.reset()
      this.routes = routes
      this.vehicle = vehicle
      this.start = start
      this.end = end
      this.displayRoute()

    })

    listen('toggle_route', (mainRouteId) => {
      this.routes.forEach((route) => {
        this.map.setFeatureState({source: `source_${route.id}`, id: 1}, {isActive: route.id === mainRouteId})
      })
      this.map.moveLayer(`route_${mainRouteId}`)
    })
  }

  displayRoute() {



    if(this.routes && this.routes.length > 0){
      let mainRoute = this.routes.find((route) => route.isActive)
      let otherRoutes = this.routes.filter((route) => !route.isActive)

      otherRoutes.forEach((route) => {
        this.showPolygon(route)
      })
      this.showPolygon(mainRoute)


      // Custom markers
      const markerStart = document.createElement('div')
      markerStart.className = this.vehicle === "walking" ? 'itinerary_marker_start_walking' : 'itinerary_marker_start'

      this.markerStart = new Marker(markerStart)
        .setLngLat([this.start.latLon.lng, this.start.latLon.lat])
        .addTo(this.map)

      const markerEnd = document.createElement('div')
      markerEnd.className = 'itinerary_marker_end'


      this.markerEnd = new Marker(markerEnd)
        .setLngLat([this.end.latLon.lng, this.end.latLon.lat])
        .addTo(this.map)

      fire('fit_map', {bbox : this.computeBBox(mainRoute)}, {sidePanelOffset : true})

    }
  }


  reset() {
    this.routes.forEach((route) => {
      this.map.removeLayer(`route_${route.id}`)
    })
  }

  showPolygon(route) {

    const geojson = {
      "id": `route_${route.id}`,
      "type": "line",
      "source": `source_${route.id}`,
      "layout": {
        "line-join": "round",
        "line-cap": "round",
        "visibility": "visible"
      },
      "paint": {
        "line-color": ["case",
          ["boolean", ["feature-state", "isActive"], route.isActive],
          MAIN_ROUTE_COLOR,
          ALTERNATE_ROUTE_COLOR
        ],
        "line-width": 5
      }
    }

    const sourceJSON = {
      "type": "geojson",
      "data": {
        "id" : 1,
        "type": "Feature",
        "properties": {},
        "geometry": {
          "type": "LineString",
          "coordinates": route.geometry.coordinates,
        }
      }
    }


    this.map.addSource(`source_${route.id}`, sourceJSON, this.routeCounter)
    this.map.addLayer(geojson);

  }

  computeBBox(route) {
    let bounds = new LngLatBounds()
    route.geometry.coordinates.forEach((coordinate) => {
      bounds.extend(new LngLat(coordinate[0], coordinate[1]))
    })

    return bounds
  }
}
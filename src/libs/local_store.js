const Error = require('../adapters/error').default

function LocalStore() {}

LocalStore.prototype.getAllPois = function() {
  return new Promise((resolve) => {
    const items = Object.keys(localStorage).reduce((filtered, k) => {
      if (Poi.isPoiCompliantKey(k)) {
        try {
          let poi = JSON.parse(localStorage.getItem(k))
          filtered.push(poi)
        } catch (e) {
          Error.sendOnce('local_store', 'getAllPois', 'error getting pois', e)
        }
      }
      return filtered
    }, [])
    resolve(items)
  })
}

LocalStore.prototype.register = function() {
  console.log('local storage doesn\'t support register method')
  return Promise.resolve()
}

LocalStore.prototype.onConnect = function () {
  return Promise.resolve()
}

LocalStore.prototype.get = function(k) {
  return new Promise((resolve) => {
    try {
      resolve(JSON.parse(localStorage.getItem(k)))
    } catch (e) {
      Error.sendOnce('local_store', 'get', `error parsing item with key ${k}`, e)
      resolve(null)
    }
  })
}

LocalStore.prototype.set = function(k, v) {
 try {
   localStorage.setItem(k,JSON.stringify(v))
 } catch (e) {
   Error.sendOnce('local_store', 'set', 'error setting item', e)
 }
 return new Promise((resolve)=>{resolve()})
}

LocalStore.prototype.clear = function() {
 try {
   localStorage.clear()
 } catch (e) {
   Error.sendOnce('local_store', 'clear', 'error clearing store', e)
 }
 return new Promise((resolve)=>{resolve()})
}

LocalStore.prototype.del = function(k) {
  try {
    localStorage.removeItem(k)
  } catch (e) {
    Error.sendOnce('local_store', 'del', 'error removing item', e)
  }
  return new Promise((resolve)=>{resolve()})
}

module.exports = LocalStore

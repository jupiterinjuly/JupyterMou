// Remember a click while the dynamically imported search dialog is loading.
export function createSearchModalRef() {
  let current = null
  let requested = false
  const flush = () => {
    if (requested && current) {
      requested = false
      current.openSearch()
    }
  }
  return {
    get current() {
      return current
    },
    set current(instance) {
      current = instance
      if (instance && requested) queueMicrotask(flush)
    },
    openSearch() {
      requested = true
      flush()
    }
  }
}

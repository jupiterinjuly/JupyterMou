const numberValue = value => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

export const buildGlobeMarkers = (countries = []) => {
  const validCountries = countries.filter(
    country =>
      Number.isFinite(country.latitude) &&
      Number.isFinite(country.longitude) &&
      numberValue(country.users) > 0
  )
  const maxUsers = Math.max(
    1,
    ...validCountries.map(country => numberValue(country.users))
  )

  return validCountries.map(country => {
    const intensity =
      Math.log1p(numberValue(country.users)) / Math.log1p(maxUsers)
    const size = Math.min(0.09, Math.max(0.025, 0.025 + intensity * 0.065))
    return {
      location: [country.latitude, country.longitude],
      size: Number(size.toFixed(4))
    }
  })
}

export const formatDate = (dateStr) => {
  let date = new Date(dateStr)
  date = date.getFullYear()+ "/" + (date.getMonth() + 1) + "/" + date.getDate();
  const dateIsValid = /^(19|20)\d\d[- \.\/](0?[1-9]|1[012])[- \.\/](0?[1-9]|[12][0-9]|3[01])$/
  if (!dateIsValid.test(date)){
    return dateStr = "2000/01/01"
  }
  return date
}
 
export const formatStatus = (status) => {
  switch (status) {
    case "pending":
      return "En attente"
    case "accepted":
      return "Accepté"
    case "refused":
      return "Refused"
  }
}
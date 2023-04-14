export function excludeProperty(
  entity: any,
  excludedFieldName?: string,
  firstExcludedListName?: string,
  secondExcludedListName?: string,
  thirdExcludedListName?: string,
  fourthExcludedListName?: string
) {
  const {
    [excludedFieldName]: excludedProperty,
    [firstExcludedListName]: firstExcludedList,
    [secondExcludedListName]: secondExcludedList,
    [thirdExcludedListName]: thirdExcludedList,
    [fourthExcludedListName]: fourthExcludedList,
    ...rest
  } = entity;
  return rest;
}

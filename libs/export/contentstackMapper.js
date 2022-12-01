const {
  singleLine,
  multiLine,
  email,
  link,
  number,
  date,
  boolean,
  jsonRTE,
  reference,
  file,
  dropdownNumber,
  dropdownString,
  radioNumber,
  radioString,
} = require("./contentstackSchema");

function drupalMapper(value, contentType) {
  const schemaArray = [
    {
      display_name: "Title",
      uid: "title",
      data_type: "text",
      mandatory: false,
      unique: false,
      field_metadata: {
        _default: true,
      },
      multiple: false,
    },
    {
      display_name: "URL",
      uid: "url",
      data_type: "text",
      mandatory: false,
      field_metadata: {
        _default: true,
      },
      multiple: false,
      unique: false,
    },
  ];
  for (const type of value) {
    switch (type?.type) {
      case "text_with_summary":
        schemaArray.push(jsonRTE(type, contentType));
        break;
      case "email":
        schemaArray.push(email(type));
        break;
      case "taxonomy_term_reference":
        schemaArray.push(reference(type, contentType));
        break;
      case "image":
        schemaArray.push(file(type));
        break;
      case "text_long":
        schemaArray.push(jsonRTE(type, contentType));
        break;
      case "file":
        schemaArray.push(file(type));
        break;
      case "text":
        schemaArray.push(multiLine(type));
        break;
      case "string":
        schemaArray.push(singleLine(type));
        break;
      case "string_long":
        schemaArray.push(multiLine(type));
        break;
      case "list_boolean":
        schemaArray.push(boolean(type));
        break;
      case "boolean":
        schemaArray.push(boolean(type));
        break;
      case "date":
        schemaArray.push(date(type));
        break;
      case "datetime":
        schemaArray.push(date(type));
        break;
      case "datestamp":
        schemaArray.push(date(type));
        break;
      case "timestamp":
        schemaArray.push(date(type));
        break;
      case "integer":
        schemaArray.push(number(type));
        break;
      case "number_integer":
        schemaArray.push(number(type));
        break;
      case "decimal":
        schemaArray.push(number(type));
        break;
      case "number_decimal":
        schemaArray.push(number(type));
        break;
      case "float":
        schemaArray.push(number(type));
        break;
      case "number_float":
        schemaArray.push(number(type));
        break;
      case "entity_reference":
        schemaArray.push(reference(type, contentType));
        break;
      case "entityreference":
        switch (type.reference_difference) {
          case "file":
            schemaArray.push(file(type));
            break;
          default:
            schemaArray.push(reference(type, contentType));
            break;
        }
        break;
      case "taxonomy_term_reference":
        schemaArray.push(reference(type, contentType));
        break;
      case "link":
        schemaArray.push(link(type));
        break;
      case "link_field":
        schemaArray.push(link(type));
        break;
      case "list_integer":
        switch (type?.widget_type) {
          case "options_select":
            schemaArray.push(dropdownNumber(type));
            break;
          case "options_buttons":
            schemaArray.push(radioNumber(type));
            break;
        }
        break;
      case "list_float":
        switch (type?.widget_type) {
          case "options_select":
            schemaArray.push(dropdownNumber(type));
            break;
          case "options_buttons":
            schemaArray.push(radioNumber(type));
            break;
        }
        break;
      case "list_text":
        switch (type?.widget_type) {
          case "options_select":
            schemaArray.push(dropdownString(type));
            break;
          case "options_buttons":
            schemaArray.push(radioString(type));
            break;
        }
        break;
      case "comment":
        schemaArray.push(multiLine(type));
        break;
      default:
        schemaArray.push(singleLine(type));
    }
  }
  return schemaArray;
}

module.exports = { drupalMapper };

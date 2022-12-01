function singleLine(data) {
  return {
    data_type: "text",
    display_name: data.field_label,
    uid: data["field_name"],
    field_metadata: {
      description: data.description,
      default_value: data?.default_value ?? "",
      multiline: true,
      error_message: "",
    },
    format: "",
    multiple: false,
    mandatory: false,
    unique: false,
  };
}

function multiLine(data) {
  return {
    data_type: "text",
    display_name: data.field_label,
    uid: data["field_name"],
    field_metadata: {
      description: data.description,
      default_value: data?.default_value ?? "",
      multiline: true,
      error_message: "",
    },
    format: "",
    multiple: false,
    mandatory: false,
    unique: false,
  };
}

function email(data) {
  return {
    data_type: "text",
    display_name: data.field_label,
    uid: data["field_name"],
    field_metadata: {
      description: data.description,
    },
    mandatory: false,
    multiple: false,
    non_localizable: false,
    unique: false,
  };
}

function boolean(data) {
  return {
    data_type: "boolean",
    display_name: data.field_label,
    uid: data["field_name"],
    field_metadata: {
      description: data.description,
      default_value: parseInt(data?.default_value) ?? "",
    },
    multiple: false,
    mandatory: false,
    unique: false,
  };
}

function date(data) {
  var isoDate = new Date();
  if (data?.default_value) {
    isoDate.toISOString(data?.default_value);
  }
  return {
    data_type: "isodate",
    display_name: data.field_label,
    uid: data["field_name"],
    field_metadata: {
      description: data.description,
      default_value: isoDate.toISOString(data?.default_value) ?? "",
    },
    multiple: false,
    mandatory: false,
    unique: false,
  };
}

function number(data) {
  let minValue, maxValue, defaultValue;
  if (
    data.type === "number_float" ||
    data.type === "list_float" ||
    data.type === "number_decimal"
  ) {
    minValue = parseFloat(data?.min);
    maxValue = parseFloat(data?.max);
    defaultValue = parseFloat(data?.default_value) ?? "";
  } else {
    minValue = parseInt(data?.min);
    maxValue = parseInt(data?.max);
    defaultValue = parseInt(data?.default_value) ?? "";
  }
  return {
    data_type: "number",
    display_name: data.field_label,
    uid: data["field_name"],
    field_metadata: {
      description: data.description,
      default_value: defaultValue,
    },
    min: minValue,
    max: maxValue,
    multiple: false,
    mandatory: false,
    unique: false,
  };
}

function link(data) {
  return {
    data_type: "link",
    display_name: data.field_label,
    uid: data["field_name"],
    field_metadata: {
      description: data.description,
      default_value: { title: "", url: "" },
    },
    mandatory: false,
    multiple: false,
    non_localizable: false,
    unique: false,
  };
}

function jsonRTE(data, contentType) {
  return {
    data_type: "json",
    display_name: data.field_label,
    uid: data["field_name"],
    field_metadata: {
      allow_json_rte: true,
      embed_entry: false,
      description: "",
      default_value: data?.default_value ?? "",
      multiline: true,
      rich_text_type: "advanced",
      options: [],
    },
    format: "",
    error_messages: { format: "" },
    reference_to: [...contentType, "taxonomy", "vocabulary", "sys_assets"],
    multiple: false,
    non_localizable: false,
    unique: false,
    mandatory: false,
  };
}

function reference(data, contentType) {
  var referenceData = [];
  if (data.reference_difference === "taxonomy_term") {
    referenceData.push("taxonomy");
  } else if (data.reference_difference === "taxonomy_vocabulary") {
    referenceData.push("vocabulary");
  } else if (data.reference_difference === "node") {
    for (const [key, value] of Object.entries(data.reference_content)) {
      referenceData.push(value);
    }
  } else {
    referenceData.push(...contentType, "taxonomy", "vocabulary");
  }
  return {
    data_type: "reference",
    display_name: data.field_label,
    reference_to: referenceData,
    field_metadata: {
      ref_multiple: true,
      ref_multiple_content_types: true,
    },
    uid: data["field_name"],
    mandatory: false,
    multiple: false,
    non_localizable: false,
    unique: false,
  };
}

function file(data) {
  return {
    data_type: "file",
    display_name: data.field_label,
    uid: data["field_name"],
    field_metadata: {
      description: data.description,
      rich_text_type: "standard",
    },
    multiple: false,
    mandatory: false,
    unique: false,
  };
}

function dropdownNumber(data) {
  let choices = [],
    defaultValue,
    defaultKey = [];
  if (data?.allowed_values === 0 || data?.allowed_values === undefined) {
    choices.push({ value: 0, key: 0 });
  } else {
    if (
      data.type === "number_float" ||
      data.type === "list_float" ||
      data.type === "number_decimal"
    ) {
      for (const [key, value] of Object.entries(data.allowed_values)) {
        choices.push({
          value: parseFloat(key),
          key: value,
        });
      }
    } else {
      for (const [key, value] of Object.entries(data.allowed_values)) {
        choices.push({
          value: parseInt(key),
          key: value,
        });
      }
    }
  }

  // for getting default value key
  for (const [key, value] of Object.entries(data.allowed_values)) {
    if (data?.default_value === value) {
      defaultKey.push(key);
    }
  }

  if (
    data.type === "number_float" ||
    data.type === "list_float" ||
    data.type === "number_decimal"
  ) {
    defaultValue = parseFloat(data?.default_value);
  } else {
    defaultValue = parseInt(data?.default_value);
  }

  return {
    data_type: "number",
    display_name: data.field_label,
    display_type: "dropdown",
    enum: { advanced: true, choices: choices },
    multiple: false,
    uid: data["field_name"],
    field_metadata: {
      description: data.description,
      default_value: defaultValue ?? "",
      default_key: defaultKey.join() ?? "",
    },
    mandatory: false,
    non_localizable: false,
    unique: false,
  };
}

function dropdownString(data) {
  let choices = [],
    defaultKey = [];
  if (data?.allowed_values === 0 || data?.allowed_values === undefined) {
    choices.push({ value: "value", key: "key" });
  } else {
    for (const [key, value] of Object.entries(data.allowed_values)) {
      choices.push({
        value: key,
        key: value,
      });
    }
  }

  // for getting default value key
  for (const [key, value] of Object.entries(data.allowed_values)) {
    if (data?.default_value === value) {
      defaultKey.push(key);
    }
  }

  return {
    data_type: "text",
    display_name: data.field_label,
    display_type: "dropdown",
    enum: { advanced: true, choices: choices },
    multiple: false,
    uid: `${data["field_name"]}_value`,
    field_metadata: {
      description: data.description,
      default_value: data?.default_value ?? "",
      default_key: defaultKey.join() ?? "",
    },
    mandatory: false,
    non_localizable: false,
    unique: false,
  };
}

function radioNumber(data) {
  let choices = [],
    defaultValue,
    defaultKey = [];
  if (data?.allowed_values === 0 || data?.allowed_values === undefined) {
    choices.push({ value: 0, key: 0 });
  } else {
    if (
      data.type === "number_float" ||
      data.type === "list_float" ||
      data.type === "number_decimal"
    ) {
      for (const [key, value] of Object.entries(data.allowed_values)) {
        choices.push({
          value: parseFloat(key),
          key: value,
        });
      }
    } else {
      for (const [key, value] of Object.entries(data.allowed_values)) {
        choices.push({
          value: parseInt(key),
          key: value,
        });
      }
    }
  }

  // for getting default value key
  for (const [key, value] of Object.entries(data.allowed_values)) {
    if (data?.default_value === value) {
      defaultKey.push(key);
    }
  }

  if (
    data.type === "number_float" ||
    data.type === "list_float" ||
    data.type === "number_decimal"
  ) {
    defaultValue = parseFloat(data?.default_value);
  } else {
    defaultValue = parseInt(data?.default_value);
  }

  return {
    data_type: "number",
    display_name: data.field_label,
    display_type: "radio",
    enum: {
      advanced: true,
      choices: choices,
    },
    multiple: false,
    uid: data["field_name"],
    field_metadata: {
      description: data.description,
      default_value: defaultValue ?? "",
      default_key: defaultKey.join() ?? "",
    },
    mandatory: false,
    non_localizable: false,
    unique: false,
  };
}

function radioString(data) {
  let choices = [],
    defaultKey = [];
  if (data?.allowed_values === 0 || data?.allowed_values === undefined) {
    choices.push({ value: "value", key: "key" });
  } else {
    for (const [key, value] of Object.entries(data.allowed_values)) {
      choices.push({
        value: key,
        key: value,
      });
    }
  }

  // for getting default value key
  for (const [key, value] of Object.entries(data.allowed_values)) {
    if (data?.default_value === value) {
      defaultKey.push(key);
    }
  }
  return {
    data_type: "text",
    display_name: data.field_label,
    display_type: "radio",
    enum: {
      advanced: true,
      choices: choices,
    },
    multiple: false,
    uid: data["field_name"],
    field_metadata: {
      description: data.description,
      default_value: data?.default_value ?? "",
      default_key: defaultKey.join() ?? "",
    },
    mandatory: false,
    non_localizable: false,
    unique: false,
  };
}

module.exports = {
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
};

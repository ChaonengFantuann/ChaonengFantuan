import moment from "moment";

export const setFieldAdaptor = (data) => {
  if (data?.layout?.tabs && data.dataSource) {
    const result = {};
    data.layout.tabs.forEach((tab) => {
      tab.data.forEach((field) => {
        switch (field.type) {
          case 'datetime':
            //field.key === create_time
            result[field.key] = moment(data.dataSource[field.key]);
            break;
          default:
            result[field.key] = data.dataSource[field.key];
            break;
        }
      });
    });
    return result;
  }
  return {};
};


export const submitFieldsAdaptor = (formValues) => {
  const result = formValues;
  Object.keys(formValues).forEach((key) => {
    if (moment.isMoment(formValues[key])) {
      result[key] = moment(formValues[key]).format();
    }
  });
  return result;
};
import moment from "moment";
import { Space, Tag } from "antd";
import ActionBuilder from "./ActionBuilder";

const ColumnBuilder = (tableColumn, actionHandler) => {
  const newColumns = [];
  (tableColumn || []).forEach((column) => {
    if (column.hideInColumn !== true) {
      switch (column.type) {
        case 'datetime':
          column.render = (value) => {
            return moment(value).format('YYYY-MM-DD HH:mm:ss');
          };
          break;
        case 'switch':
          column.render = (value) => {
            const option = (column.data || []).find((item) => item.value === value);
            return <Tag color={value ? 'blue' : 'red'}>{option.title}</Tag>
          }
          break;
        case 'actions':
          column.render = (value, record) => {
            return (
              <Space>{ActionBuilder(column.actions, actionHandler, false, record)}</Space>
            )
          }
          break;
        default:
          break;
      }
      newColumns.push(column)
    }
  });
  const idColumn = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id'
    },
  ];
  return idColumn.concat(newColumns);
};

export default ColumnBuilder;
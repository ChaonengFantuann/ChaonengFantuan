import { useState, useEffect } from "react";
import { Table, Row, Col, Card, Pagination, Space, message, Modal as AntdModal, Tooltip, Button, Form, InputNumber } from "antd";
import { useToggle } from "ahooks";
import { stringify } from 'query-string'
import { useRequest, history, useLocation } from "umi";
import QueueAnim from 'rc-queue-anim';
import { PageContainer, FooterToolbar } from "@ant-design/pro-layout";
import { ExclamationCircleOutlined, SearchOutlined } from "@ant-design/icons";
import ColumnBuilder from "./builder/ColumnBuilder";
import ActionBuilder from "./builder/ActionBuilder";
import SearchBuiler from "./builder/SearchBuilder";
import Modal from "./compoment/Modal";
import { submitFieldsAdaptor } from "./helper";
import styles from "./index.less";


const index = () => {
  const [pageQuery, setPageQuery] = useState('');
  const [sortQuery, setSortQuery] = useState('');
  const [modalVisible, setmodalVisible] = useState(false);
  const [modalUrl, setModalUrl] = useState('');
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [seletedRows, setSeletedRows] = useState([]);
  const [tableColumns, setTableColumns] = useState([]);
  const [searchVisible, searchAction] = useToggle(false);
  const { confirm } = AntdModal;
  const [searchForm] = Form.useForm();
  const location = useLocation();

  const init = useRequest((values) => {
    return {
      url: `https://public-api-v2.aspirantzhang.com${location.pathname.replace('/basic-list', '')}?X-API-KEY=antd${pageQuery}${sortQuery}`,
      params: values,
      paramsSerializer: (params) => {
        console.log(params);
        return stringify(params, { arrayFormat: 'comma', skipEmptyString: true, skipNull: true });
        // console.log(stringify(params, { arrayFormat: 'comma' }));
      },
    };
  });

  const request = useRequest(
    (values) => {
      message.loading({ content: 'Processing...', key: 'process', duration: 0 })
      const { uri, method, ...formValues } = values;
      return {
        url: `https://public-api-v2.aspirantzhang.com${uri}`,
        method: method,
        // body: JSON.stringify(formValues),
        data: {
          ...formValues,
          'X-API-KEY': 'antd',
        }
      };
    },
    {
      manual: true,
      onSuccess: (data) => {
        message.success({
          content: data?.message,
          key: 'process',
        });
      },
      formatResult: (res) => {
        return res;
      }
    }
  );

  useEffect(() => {
    init.run();
  }, [pageQuery, sortQuery, location.pathname])

  useEffect(() => {
    if (init?.data?.layout?.tableColumn) {
      setTableColumns(ColumnBuilder(init.data.layout.tableColumn, actionHandler))
    }
  }, [init?.data?.layout?.tableColumn])

  useEffect(() => {
    if (modalUrl) {
      setmodalVisible(true);
    }
  }, [modalUrl])

  function actionHandler(action, record) {
    switch (action.action) {
      case 'modal':
        setModalUrl(
          (action.uri || '').replace(/:\w+/g, (field) => {
            return record[field.replace(':', '')];
          }),
        );
        break;
      case 'page':
        const uri = (action.uri || '').replace(/:\w+/g, (field) => {
          return record[field.replace(':', '')];
        });
        history.push(`/basic-list${uri}`)
        break;
      case 'reload':
        init.run();
        break;
      case 'delete':
      case 'deletePermanently':
      case 'restore':
        // console.log(record);
        confirm({
          title: 'Are you sure delete this task?',
          icon: <ExclamationCircleOutlined />,
          content: batchOverview(Object.keys(record).length ? [record] : seletedRows),
          okText: `Sure to ${action.action}!!!`,
          cancelText: 'Cancel',
          onOk() {
            return request.run({
              uri: action.uri,
              method: action.method,
              type: action.action,
              ids: Object.keys(record).length ? [record.id] : selectedRowKeys,
            });
          },
          onCancel() {
            console.log('Cancel');
          },
        })
      default:
        break;
    }
  };

  const batchOverview = (dataSource) => {
    const tableColumns = ColumnBuilder(init?.data?.layout?.tableColumn, actionHandler)
    return (
      <Table
        size="small"
        rowKey="id"
        dataSource={dataSource}
        columns={[tableColumns[0] || {}, tableColumns[1] || {}]}
        pagination={false}
      />
    );
  }

  const paginationChangeHandler = (page, per_page) => {
    // console.log(page, perpage);
    setPageQuery(`&page=${page}&per_page=${per_page}`);
  }

  const tableChangeHandler = (_, __, sorten) => {
    if (sorten.order === undefined) {
      setSortQuery('');
    }
    else {
      const orderBy = sorten.order === 'ascend' ? 'asc' : 'desc';
      setSortQuery(`&sort=${sorten.field}&order=${orderBy}`);
    }
  };

  const hideModal = (reload = false) => {
    setmodalVisible(false);
    setModalUrl('')
    if (reload) {
      init.run();
    };
  };

  const rowSelection = {
    seletedRowKeys: selectedRowKeys,
    onChange: (_seletedRowKeys, _seletedRows) => {
      setSelectedRowKeys(_seletedRowKeys);
      setSeletedRows(_seletedRows)
    }
  };

  const onFinish = (value) => {
    init.run(submitFieldsAdaptor(value));
  }

  const searchLayout = () => {
    return (
      <QueueAnim>
        {searchVisible && (
          <Card className="styles.searchForm">
            <Form onFinish={onFinish} form={searchForm} >
              <Row gutter={24}>
                <Col sm={6}>
                  <Form.Item label='ID' name='id' key='id'>
                    <InputNumber style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                {SearchBuiler(init?.data?.layout?.tableColumn)}
              </Row>
              <Row>
                <Col sm={24} className={styles.textAlignRight}>
                  <Space>
                    <Button type="primary" htmlType="submit">Submit</Button>
                    <Button onClick={() => {
                      init.run();
                      searchForm.resetFields();
                    }}>
                      Clear
                    </Button>
                  </Space>
                </Col>
              </Row>
            </Form>
          </Card>
        )}
      </QueueAnim>
    );
  };

  const beforeTableLayout = () => {
    return (
      <Row>
        <Col xs={24} sm={12}>
          ...
        </Col>
        <Col xs={24} sm={12} className={styles.tableToolbar}>
          <Space>
            <Tooltip title="search">
              <Button
                shape="circle"
                icon={<SearchOutlined />}
                onClick={() => {
                  searchAction.toggle();
                }}
                type={searchVisible ? 'primary' : 'default'}
              />
            </Tooltip>
            {ActionBuilder(init?.data?.layout?.tableToolBar, actionHandler)}
          </Space>
        </Col>
      </Row>
    );
  };

  const afterTableLayout = () => {
    return (
      <Row>
        <Col xs={24} sm={12}>
          ...
        </Col>
        <Col xs={24} sm={12} className={styles.tableToolbar}>
          <Pagination
            total={init?.data?.meta?.total || 0}
            current={init?.data?.meta?.page || 1}
            pageSize={init?.data?.meta?.per_page || 10}
            showSizeChanger
            showQuickJumper
            onChange={paginationChangeHandler}
            onShowSizeChange={paginationChangeHandler}
          />
        </Col>
      </Row>
    );
  };

  const batchToolBar = () => {
    // return selectedRowKeys.length ? (
    //   <Space>{ActionBuilder(init?.data?.layout?.batchToolBar, actionHandler)}</Space>
    // ) : null;
    return selectedRowKeys.length > 0 && (
      <Space>{ActionBuilder(init?.data?.layout?.batchToolBar, actionHandler)}</Space>
    );
  };

  return (
    <PageContainer>
      {searchLayout()}
      <Card>
        {beforeTableLayout()}
        <Table
          rowKey="id"
          dataSource={init?.data?.dataSource}
          columns={tableColumns}
          pagination={false}
          loading={init?.loading}
          rowSelection={rowSelection}
        />
        {afterTableLayout()}
      </Card>
      <Modal
        modalVisible={modalVisible}
        hideModal={hideModal}
        modalUrl={modalUrl}
      />
      <FooterToolbar extra={batchToolBar()} />
    </PageContainer>
  );
};

export default index;
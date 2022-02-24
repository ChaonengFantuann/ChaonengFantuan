import { useEffect } from 'react';
import { Modal as AntdModal, Form, Input, message, Tag, Spin } from 'antd';
import { useRequest } from 'umi';
import moment from 'moment';
import FormBuiler from '../builder/FormBuilder';
import ActionBuilder from '../builder/ActionBuilder';
import { setFieldAdaptor, submitFieldsAdaptor } from '../helper';
import styles from '../index.less';


const Modal = ({
  modalVisible,
  hideModal,
  modalUrl
}) => {
  const [form] = Form.useForm();

  const layout = {
    labelCol: { span: 8 },
    // warppercol: { span: 16 },
  };

  const init = useRequest(
    `https://public-api-v2.aspirantzhang.com${modalUrl}?X-API-KEY=antd`,
    {
      manual: true,
      onError: () => {
        hideModal();
      },
    },
  );

  const request = useRequest(
    (values) => {
      message.loading({ content: 'Processing...', key: 'process', duration: 0 })
      const { uri, method, ...formValues } = values;
      return {
        url: `https://public-api-v2.aspirantzhang.com${uri}`,
        method: method,
        // body: JSON.stringify(formValues),
        data: {
          ...submitFieldsAdaptor(formValues),
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
        hideModal(true);
      },
      formatResult: (res) => {
        return res;
      }
    }
  );

  useEffect(() => {
    if (modalVisible) {
      form.resetFields();
      init.run();
    }
  }, [modalVisible]);

  useEffect(() => {
    if (init.data) {
      form.setFieldsValue(setFieldAdaptor(init.data));
    }
  }, [init.data])

  const actionHandler = action => {
    // console.log("bbb");
    switch (action.action) {
      case 'submit':
        form.setFieldsValue({ uri: action.uri, method: action.method })
        form.submit();
        break;
      case 'cancel':
        hideModal();
        break;
      case 'reset':
        form.resetFields();
        break;
      default:
        break;
    }
  }

  const onFinish = (values) => {
    // console.log(values);
    request.run(values);
  }

  return (
    <div>
      <AntdModal
        title={init?.data?.page?.title}
        visible={modalVisible}
        onCancel={hideModal}
        footer={
          ActionBuilder(
            init?.data?.layout?.actions[0]?.data, actionHandler,
            request?.loading
          )
        }
        maskClosable={false}
        forceRender
      >
        {init?.loading ? (
          <Spin className='formSpin' tip="loading" />
        ) : (
          <Form
            form={form}
            {...layout}
            initialValues={{
              create_time: moment(),
              update_time: moment(),
              status: true,
            }}
            onFinish={onFinish}
          >
            {FormBuiler(init?.data?.layout?.tabs[0]?.data)}
            <Form.Item name="uri" key="uri" hidden>
              <Input />
            </Form.Item>
            <Form.Item name="method" key="method" hidden>
              <Input />
            </Form.Item>
            <Tag className={styles.formUpdateTime}>
              Update Time: {moment(form.getFieldValue('update_time')).format('YYYY-MM-DD HH:mm:ss')}
            </Tag>
          </Form>
        )}
      </AntdModal>
    </div>
  );
};

export default Modal;
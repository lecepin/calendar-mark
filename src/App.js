import React from "react";
import IndexDBWrapper from "indexdbwrapper";
import {
  Modal,
  Button,
  Input,
  message,
  Table,
  Divider,
  Select,
  Dropdown,
  Menu,
} from "antd";
import { CirclePicker } from "react-color";
import { LeftOutlined, RightOutlined, RedoOutlined } from "@ant-design/icons";

import "./App.css";

function getMonth(date) {
  return date.getMonth() + 1;
}

function getMonthDays(year, month) {
  return new Date(year, month, 0).getDate();
}

function getDay(year, month, day) {
  return new Date(`${year}-${month}-${day}`).getDay();
}

// db.add("cale-mark", { date: "2021-1-2", value: { types: [1, 2, 3] } });
// db.getAllMatching("cale-mark", {
//   index: "date",
//   query: IDBKeyRange.only("2021-1-32"),
// }).then((data) => console.log(data[0]));

class App extends React.Component {
  db = new IndexDBWrapper("lp-cale-db", 1, {
    onupgradeneeded: (e) => {
      const db = e.target.result;

      db.createObjectStore("lp-cale-mark", {
        autoIncrement: true,
        keyPath: "id",
      }).createIndex("date", "date", { unique: true });
      db.createObjectStore("lp-cale-type", {
        autoIncrement: true,
        keyPath: "id",
      }).createIndex("name", "name", { unique: true });
    },
  });

  state = {
    currentDate: new Date(),
    showOpDateModal: false,
    showTypeModal: false,
    opDate: "",
    types: [],
    addName: "",
    addValue: "",
    updateTypesValue: [],
    updateRemarkValue: "",
    marks: {},
  };

  componentDidMount() {
    this.db.getAll("lp-cale-mark").then((data) => {
      console.log(data);
      const rst = {};

      data.map((item) => {
        rst[item.date] = item;
      });
      this.setState({
        marks: rst,
      });
    });
    this.db.getAll("lp-cale-type").then((data) => {
      console.log(data);
      this.setState({
        types: data,
      });
    });
  }

  handleItemClick(value) {
    this.setState({
      opDate: value,
      showOpDateModal: true,
      updateTypesValue: this.state.marks[value]?.types || [],
      updateRemarkValue: this.state.marks[value]?.remark || "",
    });
  }

  handleUpdateItem(key, value) {
    this.db
      .getAllMatching("lp-cale-mark", {
        index: "date",
        query: IDBKeyRange.only(key),
      })
      .then((data) => {
        console.log(data);

        if (data.length) {
          this.db.put("lp-cale-mark", { ...data[0], date: key, ...value });
        } else {
          this.db.put("lp-cale-mark", { date: key, ...value });
        }

        this.setState({
          marks: {
            ...this.state.marks,
            [key]: value,
          },
          showOpDateModal: false,
        });

        message.success();
      });
  }

  handleAddType(value) {
    if (!value.name || !value.value) {
      message.error("填写不完整");
      return;
    }
    this.db.add("lp-cale-type", value).then(() => message.success());
    this.setState({
      types: [...this.state.types, value],
    });
  }

  handleOpMonthChange(type, { year, month, day }) {
    if (type == "left") {
      if (month == 1) {
        return this.setState({
          currentDate: new Date(`${year - 1}-${12}-${day}`),
        });
      }

      this.setState({
        currentDate: new Date(`${year}-${month - 1}-${day}`),
      });
    }

    if (type == "right") {
      if (month == 12) {
        return this.setState({
          currentDate: new Date(`${year + 1}-${1}-${day}`),
        });
      }

      this.setState({
        currentDate: new Date(`${year}-${month + 1}-${day}`),
      });
    }
  }

  render() {
    const {
      currentDate,
      showOpDateModal,
      opDate,
      showTypeModal,
      addName,
      addValue,
      types,
      updateTypesValue,
      updateRemarkValue,
      marks,
    } = this.state;
    const typesObj = {};

    types.map((item) => (typesObj[item.name] = item.value));
    // 年，月，日
    const [year, month, day, ,] = [
      currentDate.getFullYear(),
      getMonth(currentDate),
      currentDate.getDate(),
    ];
    // 1号周几，当月总天数
    const [week, monthDays] = [
      getDay(year, month, 1),
      getMonthDays(year, month),
    ];

    return (
      <div className="App">
        <div className="opBar">
          <Button
            icon={<LeftOutlined />}
            onClick={() =>
              this.handleOpMonthChange("left", { year, month, day })
            }
          ></Button>
          {year} 年{month}月
          <Button
            icon={<RightOutlined />}
            onClick={() =>
              this.handleOpMonthChange("right", { year, month, day })
            }
          ></Button>
          <Button
            onClick={() =>
              this.setState({
                showTypeModal: true,
                addName: "",
                addValue: "#000",
              })
            }
          >
            类型
          </Button>
          <Dropdown
            overlay={
              <Menu>
                <Menu.Item key="upload">上传</Menu.Item>
                <Menu.Item key="download">下载</Menu.Item>
              </Menu>
            }
            arrow
            placement="bottomRight"
          >
            <Button icon={<RedoOutlined />} />
          </Dropdown>
        </div>

        <div className="dayBar">
          {["日", "一", "二", "三", "四", "五", "六"].map((item) => (
            <div>{item}</div>
          ))}
        </div>

        <div className="cale">
          {new Array(week).fill().map(() => (
            <div className="cale-item cale-invalid"></div>
          ))}
          {new Array(monthDays).fill().map((_, index) => {
            const _day = index + 1;
            const date = `${year}-${month}-${_day}`;

            return (
              <div
                className="cale-item"
                data-value={date}
                onClick={() => this.handleItemClick(date)}
              >
                <div className="cale-item-types">
                  {marks[date]?.types?.map((item) => (
                    <div style={{ background: typesObj[item] }}></div>
                  ))}
                </div>
                <div
                  className={`cale-value ${
                    day == _day ? "cale-value-current" : ""
                  }`}
                >
                  {_day}
                  {marks[date]?.remark ? "*" : null}
                </div>
              </div>
            );
          })}
          {new Array(7 - ((week + monthDays) % 7)).fill().map(() => (
            <div className="cale-item cale-invalid"></div>
          ))}
        </div>

        <Modal
          visible={showOpDateModal}
          onCancel={() =>
            this.setState({
              showOpDateModal: false,
            })
          }
          onOk={() =>
            this.handleUpdateItem(opDate, {
              types: updateTypesValue,
              remark: updateRemarkValue,
            })
          }
          title={opDate}
        >
          <Select
            mode="multiple"
            style={{ width: 200 }}
            value={updateTypesValue}
            onChange={(value) =>
              this.setState({
                updateTypesValue: value,
              })
            }
          >
            {types.map((item) => (
              <Select.Option value={item.name}>
                <div style={{ background: item.value }}>{item.name}</div>
              </Select.Option>
            ))}
          </Select>
          <Input.TextArea
            rows={4}
            value={updateRemarkValue}
            onChange={(value) =>
              this.setState({ updateRemarkValue: value.target.value })
            }
          ></Input.TextArea>
        </Modal>

        <Modal
          visible={showTypeModal}
          onCancel={() =>
            this.setState({
              showTypeModal: false,
            })
          }
          footer={false}
          title="类型管理"
        >
          <Input
            onChange={(value) =>
              this.setState({
                addName: value.target.value,
              })
            }
          />
          <CirclePicker
            onChangeComplete={(value) =>
              this.setState({
                addValue: value.hex,
              })
            }
            color={addValue}
          />
          <Button
            onClick={() =>
              this.handleAddType({
                name: addName,
                value: addValue,
              })
            }
          >
            添加
          </Button>

          <Divider />

          <Table
            size="small"
            dataSource={types}
            pagination={false}
            columns={[
              { dataIndex: "name", title: "类型" },
              {
                dataIndex: "value",
                title: "颜色",
                render: (value) => (
                  <div
                    style={{ background: value, width: 10, height: 10 }}
                  ></div>
                ),
              },
            ]}
          ></Table>
        </Modal>
      </div>
    );
  }
}

export default App;

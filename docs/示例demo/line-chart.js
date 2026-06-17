const dataX = ['公开招标', '邀请招标', '竞争性谈判', '竞争性磋商', '询价', '单一来源采购', '框架协议采购'];
const y = [650, 280, 520, 260, 480, 180, 400];
option = {
   tooltip: { // 提示框组件
      trigger: 'axis', // 触发类型
      textStyle: {
         fontSize: 12 // 文字像素
      },
   },
   xAxis: {
      data: dataX, // 数据
      min: 0, // 最小值
      type: 'category',
      boundaryGap: true, // 开始和结尾是否隔开
      axisLabel: {
         textStyle: {
            color: '#808080', // 文字颜色
            fontSize: 12 // 文字像素
         }
      },
      axisLine: {
         show: false // 是否显示坐标轴轴线
      },
      axisTick: {
         show: false // 去除刻度线
      }
   },
   yAxis: {
      type: 'value',
      name: "单位：个",
      min: 0, // 最小值
      axisLine: {
         show: false
      },
      axisLabel: {
         textStyle: {
            color: '#808080', // 文字颜色
            fontSize: 12 // 文字像素
         }
      },
      // y轴分割线的颜色
      splitLine: {
         lineStyle: {
            color: 'rgba(0,0,0,0.15)', // 分割线的颜色
         }
      }
   },
   series: [
      {
         type: 'line',
         symbolSize: 8, // 设置拐点大小
         label: {
            show: true, // 线条折点处显示值
            position: 'top', // 标签的位置
            color: "#808080", // 文字颜色
            fontSize: 12, // 文字像素
         },
         // 填充颜色设置
         areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 1, 0, 0, [
               { offset: 1, color: 'rgba(72,115,255,0.2)' },  //开始的颜色
               { offset: 0, color: 'rgba(234,233,255,0.2)' }  //结束的颜色
            ]),
         },
         // 设置拐点颜色以及边框
         itemStyle: {
            color: '#3B57F7'
         },
         lineStyle: {
            width: 1, // 线的宽度
         },
         tooltip: {
            valueFormatter: function (value) {
               return value + '个';
            }
         },
         data: y
      },
   ]
};

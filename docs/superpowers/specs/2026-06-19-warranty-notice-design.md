# 保修须知在线编辑 + 小票优化 设计文档

## 概述

在小票打印中去除商品条形码，底部添加保修须知区域，并提供一个在线富文本编辑模块来管理保修须知内容。

## 数据结构

新增 `sys_setting` 表，key-value 通用设置结构：

```prisma
model sys_setting {
  id         Int      @id @default(autoincrement())
  key        String   @unique
  value      String   @default("")
  updated_at DateTime @default(now()) @updatedAt
}
```

- `key = "warranty_notice"` 存储保修须知
- `value` 为富文本 HTML 字符串

## API 接口

路由文件：`server/src/routes/settings.ts`

| 方法 | 路径 | 鉴权 | 说明 |
|------|------|------|------|
| GET | `/api/settings/:key` | 无需登录（小票打印时调用） | 获取指定 key 的设置值 |
| PUT | `/api/settings/:key` | 需登录 | 更新指定 key 的设置值，body: `{ value }` |

## 小票改动

两个前端（`portal` 和 `client`）的 `PrintReceipt.vue`：

1. **去除条形码**：删除所有 JsBarcode 调用、BarcodeCell 子组件、条形码 SVG 渲染逻辑
2. **底部添加保修须知**：从 API 获取保修内容，在「感谢光临」上方渲染富文本 HTML

## 保修设置页面

- 位于 `client` 端，新增路由 `/settings/warranty`
- 使用 Vue-Quill 富文本编辑器
- 保存后即时生效，所有小票打印时生效

# Linux 部署指南（腾讯云轻量应用服务器）

## 目标

- 项目目录：`/home/software/lingpu-sales-system/`
- Portal：仅本机监听 `127.0.0.1:5174`
- Server：仅本机监听 `127.0.0.1:3000`
- Nginx：对外监听 `8002`
- 访问地址：`http://49.233.105.168:8002`（按要求使用 HTTP，不配置 HTTPS）
- SQLite 文件：`server/data/database.sqlite`
- 上传文件：`server/uploads/`

管理员端 `client` 不在本次部署范围。

## 首次准备

1. 在腾讯云防火墙/安全组只开放 TCP 8002。SSH 管理端口按实际需要保留；不要开放 TCP 3000 和 5174。
2. 在 Linux 上准备 Node.js 22、pnpm、Nginx 和 Git。以下项目构建必须在 Linux 执行，以生成适配 Linux 的 Prisma Client。
3. 确认 `/home/software/lingpu-sales-system/` 由 `software` 用户拥有，并将代码检出到该目录。
4. 复制 `deploy/linux/server.env.example` 到 `/etc/lingpu-sales-system.env`，设置仅 root 可读的权限，并把 `JWT_SECRET` 替换为随机强密钥。不要把此文件提交到 Git。
5. 安装和构建：

   ```bash
   cd /home/software/lingpu-sales-system
   bash scripts/build-linux.sh
   ```

6. 首次创建空数据库时执行一次：

   ```bash
   cd /home/software/lingpu-sales-system/server
   pnpm prisma:push
   ```

   之后更新版本时不要重复执行 `prisma:push`。如需导入业务数据，优先使用系统数据工具；当前工作区的 SQLite 含演示数据，部署前先确认是否要将其作为演示数据库。

## 安装并启动服务

```bash
sudo cp deploy/linux/lingpu-server.service /etc/systemd/system/
sudo cp deploy/linux/lingpu-portal.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now lingpu-server lingpu-portal
```

示例 unit 使用系统级 Node 路径 `/usr/bin/node`。如果 Node 安装在别处，先用 `command -v node` 查看路径，并同步修改两个 unit 文件。

## 配置 Nginx

```bash
sudo cp deploy/linux/nginx-lingpu.conf /etc/nginx/conf.d/lingpu-sales-system.conf
sudo nginx -t
sudo systemctl reload nginx
```

配置将 `/api/` 和 `/uploads/` 转给 Server，其余请求转给 Portal。Portal 继续处理前端单页应用路由回退。

## 检查

```bash
sudo systemctl status lingpu-server lingpu-portal nginx
curl -fsS http://127.0.0.1:3000/api/health
curl -I http://127.0.0.1:5174/
curl -I http://127.0.0.1:8002/
```

外部访问：`http://49.233.105.168:8002`。

查看日志：

```bash
sudo journalctl -u lingpu-server -u lingpu-portal -f
sudo tail -f /var/log/nginx/access.log /var/log/nginx/error.log
```

## 更新和备份

更新前先备份 `server/data/database.sqlite` 和 `server/uploads/`。更新代码后，在项目目录重新运行 `bash scripts/build-linux.sh`，然后执行：

```bash
sudo systemctl restart lingpu-server lingpu-portal
```

发布流程不得删除或覆盖 `server/data/` 与 `server/uploads/`。建议把数据库和上传目录的定期备份另存到服务器之外，并先在测试副本验证恢复流程。

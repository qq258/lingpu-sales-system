<template>
  <div class="page-container">
    <div class="page-title-row">
      <h1 class="page-title">使用手册</h1>
      <span class="title-line"></span>
      <span class="badge">2026.09</span>
    </div>
    <div class="manual-layout">
      <aside class="manual-toc glass">
        <div class="toc-title">目录</div>
        <button v-for="ch in chapters" :key="ch.id" class="toc-item" :class="{ active: activeChapter === ch.id }" @click="activeChapter = ch.id">
          <span class="toc-num">{{ ch.id }}</span><span class="toc-label">{{ ch.label }}</span>
        </button>
      </aside>
      <main class="manual-content">
        <article v-show="activeChapter === 1" class="chapter glass">
          <h2 class="ch-title">一、系统入门</h2>
          <section class="sec"><h3 class="sec-title">1.1 系统组成与访问</h3>
            <p>日常业务以 Portal 门户前端为主，账号登录后按角色和门店权限使用功能。Server 后端负责接口和数据；Client 是管理员使用的另一套前端，不是日常 Portal 操作的必需入口。</p>
            <div class="table-wrap"><table><thead><tr><th>环境</th><th>Portal 地址</th><th>说明</th></tr></thead><tbody>
              <tr><td>线上部署</td><td><code>http://49.233.105.168:8002</code></td><td>Nginx 将外部 8002 转发至 Portal 5174；无需 HTTPS。</td></tr>
              <tr><td>本机开发</td><td><code>http://localhost:5174</code></td><td>需同时启动 Server（默认 3000）。</td></tr>
            </tbody></table></div>
            <p>使用 Chrome 或 Edge 访问。扫码枪作为键盘输入设备使用；打印能力取决于浏览器和电脑已配置的打印机。</p>
          </section>
          <section class="sec"><h3 class="sec-title">1.2 登录与角色</h3>
            <p>打开 Portal 地址，输入管理员分配的用户名和密码后登录。忘记密码或账号被停用时联系超级管理员处理。</p>
            <ul><li><strong>超级管理员：</strong>管理全局数据、用户和门店；可执行数据备份、还原和清空业务数据。</li><li><strong>店长 / 门店管理员：</strong>按账号权限管理门店日常业务。</li><li><strong>店员 / 操作员：</strong>开展被授权的入库、库存查询和销售操作。</li></ul>
            <p>数据范围和可执行操作由账号角色、所属门店及服务端权限共同决定。页面上看不到某项操作时，请联系管理员确认账号权限。</p>
          </section>
          <section class="sec"><h3 class="sec-title">1.3 页面导航</h3><p>顶部导航当前包含：看板、入库、供应商、库存、品牌、开单、记录、手册、数据和设置。右上角账号菜单可退出登录。</p></section>
        </article>

        <article v-show="activeChapter === 2" class="chapter glass">
          <h2 class="ch-title">二、基础资料</h2>
          <section class="sec"><h3 class="sec-title">2.1 品牌与型号</h3>
            <ol><li>打开顶部<strong>品牌</strong>。</li><li>新增品牌，再为品牌新增型号；也可使用页面提供的快速新增或批量导入。</li><li>按实际资料填写型号名称、颜色、内存、售价、成本价、国补标记和描述。</li><li>保存后在入库或开单页面选择对应型号。</li></ol>
            <p>批量导入品牌/型号使用品牌页面的导入模板和文件要求；数据工具里的按表导入另有范围限制（见第七章）。删除已被库存或业务记录引用的资料可能失败。</p>
          </section>
          <section class="sec"><h3 class="sec-title">2.2 供应商</h3><ol><li>打开顶部<strong>供应商</strong>，选择新增。</li><li>填写供应商名称；联系人、电话、地址和备注可按需要补充。</li><li>保存后，入库时可选用该供应商；之后可在供应商列表中编辑资料。</li></ol></section>
          <section class="sec"><h3 class="sec-title">2.3 门店、用户和设置</h3><p>管理员可通过门店管理（<code>/stores</code>）和用户管理（<code>/users</code>）页面维护门店与账号；其它非顶部导航页面包括入库记录（<code>/purchase-entries</code>）、期初库存（<code>/initial-stock</code>）、库存盘点（<code>/stock-check</code>）、库存流水（<code>/stock-logs</code>）和调货（<code>/transfers</code>）。在 Portal 地址后添加括号内路径可打开对应页面，操作仍受账号权限控制。<strong>设置</strong>页面用于配置保修提示文字，该提示会用于销售小票。</p></section>
        </article>

        <article v-show="activeChapter === 3" class="chapter glass">
          <h2 class="ch-title">三、采购入库</h2>
          <section class="sec"><h3 class="sec-title">3.1 新建入库</h3>
            <ol><li>打开顶部<strong>入库</strong>。</li><li>选择已有供应商；若列表中没有，可在页面的快捷新增入口创建供应商后继续。</li><li>选择品牌和型号，填写采购单价等页面要求的信息。</li><li>逐台录入 IMEI，必要时补录 IMEI2 和 SN；扫码枪扫描后按页面提示添加。支持的批量录入格式以页面说明为准。</li><li>检查清单中的型号、数量、编号和单价，确认后提交入库。</li></ol>
            <p>IMEI 应与实物一致且不能重复。提交成功后库存和库存流水会更新。需要查询单据时打开系统中的<strong>入库记录</strong>页面。</p>
          </section>
          <section class="sec"><h3 class="sec-title">3.2 期初库存</h3><p>新门店启用时，可由有权限的管理员进入期初库存功能，选择商品并录入数量。期初数据会影响库存，录入前请核对商品和数量；页面入口不可见时联系管理员。</p></section>
        </article>

        <article v-show="activeChapter === 4" class="chapter glass">
          <h2 class="ch-title">四、库存、盘点与调货</h2>
          <section class="sec"><h3 class="sec-title">4.1 查询库存</h3><p>打开顶部<strong>库存</strong>，按品牌、型号或页面提供的筛选项查找库存。可核对库存数量及单台 IMEI、IMEI2、SN、状态等信息。列表中的库存删除/调整操作会影响业务数据，应先核对编号并填写要求的原因。</p></section>
          <section class="sec"><h3 class="sec-title">4.2 盘点与库存流水</h3><p>有权限的用户可通过库存盘点功能记录实盘数量并审核差异。审核会生成库存调整记录。库存流水用于追踪采购入库、销售出库、调货、盘点及期初等库存变动；发生差异时先查流水，再核对相关单据。</p></section>
          <section class="sec"><h3 class="sec-title">4.3 门店调货</h3><p>调货功能用于门店间移转库存。按系统流程选择来源门店、目标门店及商品，提交后由相关门店完成出库和接收。每一步以页面显示的单据状态为准；未完成前不要重复创建相同调货单。</p></section>
        </article>

        <article v-show="activeChapter === 5" class="chapter glass">
          <h2 class="ch-title">五、销售开单</h2>
          <section class="sec"><h3 class="sec-title">5.1 普通销售</h3>
            <ol><li>打开顶部<strong>开单</strong>，使用扫码或搜索选择本店有库存的商品。</li><li>核对 IMEI 和商品信息，将商品加入清单。</li><li>检查应收金额，填写实收金额和支付方式（现金、微信、支付宝、银行卡或其他），以及页面支持的客户信息。</li><li>确认收款并提交。成功后库存扣减，销售单可在<strong>记录</strong>中查询；销售记录会保存支付方式，小票不显示该字段。</li></ol>
          </section>
          <section class="sec"><h3 class="sec-title">5.2 无库存销售</h3><p>对于尚未录入库存但需要登记销售的商品，在开单页切换至<strong>无库存销售</strong>模式，按页面提示选择或新增品牌型号，录入商品编号和结算信息后提交。提交成功会登记相应商品/库存与销售记录。请确保实物、IMEI、售价及成本信息准确，避免用此模式替代常规采购入库。</p></section>
          <section class="sec"><h3 class="sec-title">5.3 销售记录</h3><p>打开顶部<strong>记录</strong>，查找销售单并查看详情。退换或更正业务应按门店现行流程和系统提供的操作处理；提交后请确认单据状态，避免重复开单。</p></section>
        </article>

        <article v-show="activeChapter === 6" class="chapter glass">
          <h2 class="ch-title">六、看板与日常核对</h2>
          <section class="sec"><h3 class="sec-title">6.1 看板</h3><p>看板展示当前账号可查看范围内的经营与库存摘要，并提供常用操作入口。统计口径和数据范围受所选门店、账号权限及页面筛选条件影响。</p></section>
          <section class="sec"><h3 class="sec-title">6.2 建议的日常流程</h3><ol><li>到货后先完成采购入库并核对 IMEI。</li><li>销售时从现有库存选择商品并确认收款。</li><li>需要查差异时查看库存流水、采购记录和销售记录。</li><li>定期创建整库备份，并将下载的备份文件保存到服务器以外的位置。</li></ol></section>
        </article>

        <article v-show="activeChapter === 7" class="chapter glass">
          <h2 class="ch-title">七、数据备份、导入导出与清理</h2>
          <section class="sec"><h3 class="sec-title">7.1 创建及下载备份</h3><ol><li>打开顶部<strong>数据</strong>，进入<strong>数据备份</strong>。</li><li>点击<strong>创建备份节点</strong>，为当前 SQLite 数据库生成完整快照；或点击<strong>下载整库备份</strong>，将当前数据库下载为 .sqlite 文件。</li><li>需要时可对备份节点下载、还原或删除。删除节点后该备份文件不可再用于还原。</li></ol></section>
          <section class="sec"><h3 class="sec-title">7.2 还原备份</h3><p>在备份节点列表点击<strong>还原</strong>，或上传有效的 .sqlite / .db 数据库文件后开始还原。还原会替换当前数据；系统会先自动备份当前数据库。还原完成后请检查页面提示和关键业务数据。还原旧备份会使当前库回到备份时的数据状态。</p></section>
          <section class="sec"><h3 class="sec-title">7.3 按表 Excel 导出与导入</h3><ul><li><strong>按表导出：</strong>可导出页面列出的供应商、库存、销售记录、品牌、型号、入库记录和库存流水等数据表。</li><li><strong>按表导入：</strong>数据工具当前仅支持供应商和品牌，文件格式为 .xlsx 或 .xls；首行字段需符合导出列名或后端支持的英文列名。</li><li>品牌重名行会被跳过并计入失败信息；导入结果区域会显示成功数和逐行错误。导入前先留存备份。</li><li>品牌型号管理页面另有品牌/型号批量导入功能，按该页面提供的模板操作。</li></ul></section>
          <section class="sec"><h3 class="sec-title">7.4 一键清空业务数据</h3><div class="warn">此功能仅超级管理员可见。执行前请确认目标系统和所有门店范围。</div>
            <p>在<strong>清空业务数据</strong>页签点击<strong>备份并清空业务数据</strong>。系统会先自动创建整库备份，再清除供应商、品牌型号、库存及 IMEI、采购/销售/调货/盘点/售后记录和业务操作日志。</p>
            <p><strong>保留内容：</strong>账号及密码、门店、角色和菜单权限、系统设置。清理影响所有门店，不支持在当前操作中撤销；若要恢复，去“数据备份”还原清理前自动生成的备份节点。清理后品牌和型号也需重新建立。</p>
          </section>
        </article>

        <article v-show="activeChapter === 8" class="chapter glass">
          <h2 class="ch-title">八、常见问题</h2>
          <section class="sec"><h3 class="sec-title">8.1 登录失败或页面没有权限</h3><p>检查 Portal 地址、用户名和密码；确认服务正常运行。账号停用、角色或门店权限异常时请联系超级管理员。</p></section>
          <section class="sec"><h3 class="sec-title">8.2 IMEI 提示重复或库存不存在</h3><p>先检查编号是否录错，并在库存页面按 IMEI 查询。重复通常表示该编号已登记；库存不存在可能是尚未入库、已经售出，或商品属于其他门店。</p></section>
          <section class="sec"><h3 class="sec-title">8.3 数据工具里的操作风险</h3><p>Excel 导入会逐行写入数据；数据库还原会覆盖当前库；一键清空会清除全门店业务数据。执行前先创建并下载备份，执行后检查结果提示。</p></section>
          <section class="sec"><h3 class="sec-title">8.4 售后功能</h3><p>当前 Portal 导航未开放售后记录入口，因此本手册不提供售后单操作步骤。售后数据会在一键清空业务数据时一并清除。</p></section>
        </article>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
const activeChapter = ref(1)
const chapters = [
  { id: 1, label: '系统入门' }, { id: 2, label: '基础资料' },
  { id: 3, label: '采购入库' }, { id: 4, label: '库存、盘点与调货' },
  { id: 5, label: '销售开单' }, { id: 6, label: '看板与日常核对' },
  { id: 7, label: '数据工具' }, { id: 8, label: '常见问题' },
]
</script>
<style scoped>
.badge {
  font-size: 12px; font-weight: 600;
  background: var(--success-light); color: var(--success);
  padding: 2px 12px; border-radius: 6px;
  white-space: nowrap;
}

.manual-layout {
  display: flex;
  gap: 24px;
  align-items: flex-start;
}

/* 侧边目录 */
.manual-toc {
  width: 200px;
  flex-shrink: 0;
  border-radius: var(--radius);
  padding: 16px 0;
  position: sticky;
  top: calc(var(--nav-height) + 28px);
}
.toc-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--text);
  padding: 0 20px 12px;
  border-bottom: 1px solid var(--border);
  margin-bottom: 8px;
  letter-spacing: 1px;
}
.toc-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 20px;
  cursor: pointer;
  transition: var(--transition);
  border-left: 3px solid transparent;
}
.manual-toc .toc-item {
  width: 100%;
  appearance: none;
  border-top: 0;
  border-right: 0;
  border-bottom: 0;
  background: transparent;
  color: var(--text-secondary);
  font: inherit;
  text-align: left;
}
.toc-item:hover {
  background: rgba(37,99,235,0.05);
}
.toc-item.active {
  background: rgba(37,99,235,0.08);
  border-left-color: var(--primary);
}
.toc-num {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--border);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  flex-shrink: 0;
}
.toc-item.active .toc-num {
  background: var(--primary);
  color: #fff;
}
.toc-label {
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.3;
}
.toc-item.active .toc-label {
  color: var(--primary);
  font-weight: 600;
}

/* 主内容区 */
.manual-content {
  flex: 1;
  min-width: 0;
}

.chapter {
  border-radius: var(--radius-lg);
  padding: 36px 40px;
  animation: fadeIn .25s ease;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

.ch-title {
  font-size: 24px;
  font-weight: 700;
  color: var(--text);
  margin-bottom: 20px;
}

.role-tag {
  display: inline-block;
  font-size: 13px;
  font-weight: 600;
  color: var(--accent);
  background: var(--accent-light);
  padding: 4px 14px;
  border-radius: 6px;
  margin-bottom: 20px;
}

.sec {
  margin-bottom: 28px;
}
.sec:last-child {
  margin-bottom: 0;
}

.sec-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border);
}

.sec p {
  font-size: 15px;
  line-height: 1.7;
  color: var(--text-secondary);
  margin-bottom: 10px;
}
.sec p strong {
  color: var(--text);
}

.sec ol,
.sec ul {
  margin: 8px 0 12px;
  padding-left: 24px;
  font-size: 15px;
  line-height: 1.8;
  color: var(--text-secondary);
}
.sec ol li,
.sec ul li {
  margin-bottom: 4px;
}
.sec ul ul,
.sec ol ul {
  margin: 4px 0 4px 20px;
}

/* 表格 */
.table-wrap {
  overflow-x: auto;
  margin: 12px 0;
}
.table-wrap table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}
.table-wrap th {
  background: rgba(37,99,235,0.06);
  color: var(--text);
  font-weight: 600;
  padding: 10px 14px;
  border: 1px solid var(--border);
  text-align: left;
  white-space: nowrap;
}
.table-wrap td {
  padding: 10px 14px;
  border: 1px solid var(--border);
  color: var(--text-secondary);
  line-height: 1.5;
}
.table-wrap td strong {
  color: var(--text);
}
.table-wrap tr:hover td {
  background: rgba(37,99,235,0.02);
}

/* 提示和警告 */
.tip,
.warn {
  font-size: 14px;
  line-height: 1.6;
  padding: 12px 16px;
  border-radius: var(--radius-sm);
  margin: 12px 0;
  border-left: 4px solid;
}
.tip {
  background: var(--primary-light);
  color: var(--primary-dark);
  border-left-color: var(--primary);
}
.warn {
  background: var(--warning-light);
  color: var(--warning);
  border-left-color: var(--warning);
}

/* 代码块 */
.code-block {
  background: #1E293B;
  color: #E2E8F0;
  font-family: 'Fira Code', 'Cascadia Code', monospace;
  font-size: 13px;
  line-height: 1.6;
  padding: 14px 18px;
  border-radius: var(--radius-sm);
  margin: 10px 0 14px;
  white-space: pre;
  overflow-x: auto;
}

/* 行内代码 */
code {
  font-family: 'Fira Code', 'Cascadia Code', monospace;
  font-size: 13px;
  background: rgba(37,99,235,0.08);
  color: var(--primary-dark);
  padding: 1px 6px;
  border-radius: 4px;
}

/* kbd 标签 */
kbd {
  font-family: inherit;
  font-size: 13px;
  background: #F1F5F9;
  border: 1px solid var(--border);
  border-radius: 4px;
  padding: 1px 6px;
  box-shadow: 0 1px 0 var(--border);
}

/* 流程展示 */
.flow-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.flow-step {
  background: var(--primary-light);
  color: var(--primary-dark);
  font-size: 13px;
  font-weight: 600;
  padding: 6px 14px;
  border-radius: 6px;
}
.flow-step.flow-done {
  background: var(--success-light);
  color: var(--success);
}
.flow-arrow {
  color: var(--text-tertiary);
  font-size: 16px;
  font-weight: 600;
}

/* Q&A */
.qa-item {
  margin-bottom: 14px;
  padding: 14px 18px;
  background: rgba(255,255,255,0.4);
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
}
.qa-q {
  font-size: 15px;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 6px;
}
.qa-a {
  font-size: 14px;
  line-height: 1.7;
  color: var(--text-secondary);
}

/* 响应式 */
@media (max-width: 960px) {
  .manual-layout {
    flex-direction: column;
  }
  .manual-toc {
    width: 100%;
    position: static;
    display: flex;
    flex-wrap: wrap;
    padding: 12px 16px;
    gap: 4px;
  }
  .toc-title {
    display: none;
  }
  .toc-item {
    padding: 6px 12px;
    border-left: none;
    border-radius: 6px;
    font-size: 13px;
  }
  .toc-item.active {
    background: var(--primary);
    color: #fff;
  }
  .toc-item.active .toc-num {
    background: rgba(255,255,255,0.3);
    color: #fff;
  }
  .toc-item.active .toc-label {
    color: #fff;
  }
  .toc-num {
    width: 20px;
    height: 20px;
    font-size: 11px;
  }
  .chapter {
    padding: 24px 20px;
  }
  .ch-title {
    font-size: 20px;
  }
}
</style>

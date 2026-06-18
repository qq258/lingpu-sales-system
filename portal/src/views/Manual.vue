<template>
  <div class="page-container">
    <div class="page-title-row">
      <h1 class="page-title">使用手册</h1>
      <span class="title-line"></span>
      <span class="badge">v1.1</span>
    </div>

    <div class="manual-layout">
      <div class="manual-toc glass">
        <div class="toc-title">目录</div>
        <div
          v-for="ch in chapters"
          :key="ch.id"
          class="toc-item"
          :class="{ active: activeChapter === ch.id }"
          @click="activeChapter = ch.id"
        >
          <span class="toc-num">{{ ch.id }}</span>
          <span class="toc-label">{{ ch.label }}</span>
        </div>
      </div>

      <div class="manual-content">
        <!-- 第一章 -->
        <div v-show="activeChapter === 1" class="chapter glass">
          <h2 class="ch-title">一、系统入门</h2>

          <section class="sec">
            <h3 class="sec-title">1.1 系统简介</h3>
            <p>本系统包含两个客户端和一个后端服务：</p>
            <div class="table-wrap">
              <table>
                <thead><tr><th>客户端</th><th>访问地址</th><th>适用人群</th><th>主要功能</th></tr></thead>
                <tbody>
                  <tr><td><strong>管理后台</strong></td><td><code>http://服务器IP:5173</code></td><td>老板、店长、管理员</td><td>全部功能管理</td></tr>
                  <tr><td><strong>门户网站</strong></td><td><code>http://服务器IP:5174</code></td><td>店员、收银员、仓管员</td><td>日常快捷操作</td></tr>
                </tbody>
              </table>
            </div>
            <ul>
              <li>两个客户端共享同一套后端数据，操作实时同步</li>
              <li>各门店数据隔离，店员只能看到本店数据</li>
              <li>老板（超级管理员）可查看全部门店数据</li>
            </ul>
          </section>

          <section class="sec">
            <h3 class="sec-title">1.2 如何登录</h3>
            <p><strong>管理后台登录：</strong></p>
            <ol>
              <li>在浏览器地址栏输入 <code>http://服务器IP:5173</code></li>
              <li>输入用户名和密码</li>
              <li>点击<strong>登录</strong>按钮</li>
              <li>系统自动识别角色和所属门店，进入数据看板</li>
            </ol>
            <p><strong>门户网站登录：</strong></p>
            <ol>
              <li>在浏览器地址栏输入 <code>http://服务器IP:5174</code></li>
              <li>输入用户名和密码</li>
              <li>点击<strong>登录</strong>按钮</li>
              <li>进入数据看板首页</li>
            </ol>
            <div class="tip">提示：如果记不住地址，可以问店长索要准确的访问地址。建议将网址添加到浏览器收藏夹。</div>
          </section>

          <section class="sec">
            <h3 class="sec-title">1.3 账号与角色说明</h3>
            <div class="table-wrap">
              <table>
                <thead><tr><th>角色</th><th>说明</th><th>权限范围</th></tr></thead>
                <tbody>
                  <tr><td><strong>超级管理员</strong>（老板）</td><td>系统最高权限</td><td>全部功能；可查看和操作所有门店数据；可管理用户和门店</td></tr>
                  <tr><td><strong>店长</strong>（store_admin）</td><td>各分店负责人</td><td>本店全部功能；可管理本店用户；调货申请/接收</td></tr>
                  <tr><td><strong>店员</strong>（operator）</td><td>日常业务操作员</td><td>本店产品查询、进货、库存查询、销售开单、打印小票、看板查看</td></tr>
                </tbody>
              </table>
            </div>
            <p>每个账号绑定所属门店。超级管理员不绑定门店，可切换查看任意门店。</p>
          </section>

          <section class="sec">
            <h3 class="sec-title">1.4 门店切换</h3>
            <p>超级管理员登录后，可以在页面顶部的门店切换器中切换不同门店，查看该门店的数据。</p>
            <ul>
              <li>门店切换仅影响数据查看范围</li>
              <li>切换后，看板、库存、销售记录等页面将显示对应门店的数据</li>
            </ul>
          </section>

          <section class="sec">
            <h3 class="sec-title">1.5 系统要求</h3>
            <div class="table-wrap">
              <table>
                <thead><tr><th>项目</th><th>要求</th></tr></thead>
                <tbody>
                  <tr><td>浏览器</td><td>Chrome、Edge 最新版本</td></tr>
                  <tr><td>网络</td><td>需通过 Tailscale 组网访问服务器</td></tr>
                  <tr><td>打印（可选）</td><td>需要打印小票的电脑需安装 CLodop 打印插件</td></tr>
                  <tr><td>扫码枪（可选）</td><td>USB 扫码枪即插即用，自动输入 IMEI</td></tr>
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <!-- 第二章 -->
        <div v-show="activeChapter === 2" class="chapter glass">
          <h2 class="ch-title">二、基础数据管理</h2>
          <div class="role-tag">管理后台操作 · 需要店长或超级管理员权限</div>

          <section class="sec">
            <h3 class="sec-title">2.1 品牌管理</h3>
            <p><strong>新增品牌：</strong></p>
            <ol>
              <li>进入管理后台 &gt; <strong>品牌型号管理</strong></li>
              <li>在品牌区域点击<strong>新增品牌</strong></li>
              <li>输入品牌名称（如"华为"、"苹果"）和描述（可选）</li>
              <li>点击<strong>确认</strong>保存</li>
            </ol>
            <p><strong>编辑/删除品牌</strong>操作类似，删除前需确保该品牌下没有型号。</p>
          </section>

          <section class="sec">
            <h3 class="sec-title">2.2 型号管理</h3>
            <p>型号是系统中最核心的基础数据，包含手机的具体配置信息。</p>
            <p><strong>新增型号：</strong></p>
            <ol>
              <li>进入管理后台 &gt; <strong>品牌型号管理</strong></li>
              <li>在型号区域点击<strong>新增型号</strong></li>
              <li>填写以下字段：</li>
            </ol>
            <div class="table-wrap">
              <table>
                <thead><tr><th>字段</th><th>必填</th><th>说明</th></tr></thead>
                <tbody>
                  <tr><td>所属品牌</td><td>是</td><td>从下拉列表中选择</td></tr>
                  <tr><td>型号名称</td><td>是</td><td>如 iPhone 17 Pro Max</td></tr>
                  <tr><td>颜色</td><td>否</td><td>如"深空黑"、"星光色"</td></tr>
                  <tr><td>运行内存（RAM）</td><td>否</td><td>如 8GB、12GB</td></tr>
                  <tr><td>存储容量（ROM）</td><td>否</td><td>如 256GB、512GB</td></tr>
                  <tr><td>销售价格</td><td>是</td><td>销售给客户的价格</td></tr>
                  <tr><td>进货成本价</td><td>否</td><td>进货时的成本价</td></tr>
                  <tr><td>厂家条码</td><td>否</td><td>包装盒上的 EAN-13 条码，必须唯一</td></tr>
                  <tr><td>上市年份 / 操作系统 / 网络制式 等</td><td>否</td><td>补充信息，选填</td></tr>
                </tbody>
              </table>
            </div>
            <div class="tip">提示：厂家条码录入后不可修改（系统唯一约束），录入时请仔细核对。</div>
            <div class="tip">型号是全门店共享的基础数据，任一门店新增的型号所有门店都能看到。</div>
          </section>

          <section class="sec">
            <h3 class="sec-title">2.3 供应商管理</h3>
            <ol>
              <li>进入管理后台 &gt; <strong>供应商管理</strong></li>
              <li>点击<strong>新增供应商</strong></li>
              <li>填写供应商名称、联系人、联系电话、地址和备注</li>
              <li>点击<strong>确认</strong>保存</li>
            </ol>
          </section>
        </div>

        <!-- 第三章 -->
        <div v-show="activeChapter === 3" class="chapter glass">
          <h2 class="ch-title">三、采购入库</h2>

          <section class="sec">
            <h3 class="sec-title">3.1 入库前准备</h3>
            <p>在入库前，请确保系统中已存在以下数据：</p>
            <ul>
              <li>✅ 相关<strong>品牌和型号</strong>已录入（如未录入，找店长操作）</li>
              <li>✅ <strong>供应商</strong>信息已录入</li>
              <li>✅ 仓库有足够的 IMEI 编码（扫码枪或记录好的 IMEI 列表）</li>
            </ul>
          </section>

          <section class="sec">
            <h3 class="sec-title">3.2 门户网站快捷入库（推荐）</h3>
            <p>适合日常快速入库操作，一步到位。</p>
            <ol>
              <li>登录门户网站，点击顶部导航的<strong>入库</strong>，或从看板点击<strong>入库</strong>快捷按钮</li>
              <li><strong>选择供应商</strong>：从下拉列表中选择本次进货的供应商</li>
              <li><strong>选择商品</strong>：依次选择品牌和型号，系统自动显示该型号的预设价格</li>
              <li><strong>录入 IMEI</strong>（两种方式）：</li>
            </ol>
            <p><strong>逐台录入（推荐配合扫码枪）：</strong></p>
            <ul>
              <li>光标聚焦 IMEI 输入框</li>
              <li>用扫码枪扫描手机包装盒上的 IMEI 条码</li>
              <li>系统自动填入 IMEI，按 <kbd>Enter</kbd> 键添加到清单</li>
              <li>可选填写 IMEI2（双卡）和 SN 码（序列号）</li>
            </ul>
            <p><strong>批量粘贴：</strong></p>
            <ul>
              <li>切换到"批量粘贴"模式</li>
              <li>复制多行 IMEI 数据粘贴到文本框中</li>
              <li>格式：每行一条，IMEI2 和 SN 可选</li>
            </ul>
            <div class="code-block">861234567890101,861234567890102,SN123456
861234567890103,,SN123457
861234567890104</div>
            <ol start="5">
              <li>在入库清单中核对已添加的手机（型号、IMEI、价格）</li>
              <li>确认无误后，点击<strong>确认入库</strong></li>
              <li>系统提示"入库成功"，库存即时更新</li>
            </ol>
            <div class="tip">使用扫码枪时，确保光标在 IMEI 输入框内，扫码后自动填充，按回车键即可添加。</div>
          </section>

          <section class="sec">
            <h3 class="sec-title">3.3 管理后台完整入库</h3>
            <p>适合需要管理入库单状态的场景，支持先保存后确认。</p>
            <ol>
              <li>进入管理后台 &gt; <strong>入库管理</strong></li>
              <li>点击<strong>新建入库单</strong></li>
              <li>选择供应商，填写备注</li>
              <li>添加商品：选择品牌 → 型号 → 输入单价 → 录入 IMEI</li>
              <li>保存入库单（状态为"待确认"）</li>
              <li>在入库单列表中，找到该入库单，点击<strong>确认入库</strong></li>
              <li>系统校验 IMEI 唯一性后完成入库</li>
            </ol>
          </section>

          <section class="sec">
            <h3 class="sec-title">3.4 IMEI 录入方式对比</h3>
            <div class="table-wrap">
              <table>
                <thead><tr><th>方式</th><th>适用场景</th><th>操作要点</th></tr></thead>
                <tbody>
                  <tr><td>扫码枪逐台录入</td><td>有实物手机，逐台扫码</td><td>光标在输入框，扫码后回车添加</td></tr>
                  <tr><td>手动逐台录入</td><td>IMEI 记录在纸上或表格中</td><td>输入 IMEI 后按回车</td></tr>
                  <tr><td>批量粘贴</td><td>有电子表格，一次录多台</td><td>按格式粘贴，系统自动解析</td></tr>
                </tbody>
              </table>
            </div>
          </section>

          <section class="sec">
            <h3 class="sec-title">3.5 IMEI2 和 SN 码录入</h3>
            <ul>
              <li><strong>IMEI2</strong>：双卡双待手机有第二个 IMEI 号，录入后方便售后查询</li>
              <li><strong>SN 码</strong>：手机序列号，厂家售后保修时需要</li>
              <li>这两个字段为可选项，入库时未录入，在销售开单时也可以补录</li>
            </ul>
          </section>

          <section class="sec">
            <h3 class="sec-title">3.6 无库存销售-入库场景(门户网站)</h3>
            <p><strong>适用</strong>:历史商品在售出时尚未登记入库,需要现录现卖。</p>
            <ol>
              <li>登录门户网站,点击顶部导航的<strong>开单</strong>,或从看板点击<strong>开单</strong>快捷按钮</li>
              <li><strong>切换销售类型</strong>:在页面顶部"销售类型"区域,选择 <strong>无库存销售</strong></li>
              <li><strong>搜索品牌型号</strong>:在品牌型号输入框中输入关键词,系统从已有型号中模糊匹配(匹配品牌名 + 型号名)</li>
              <li><strong>选择商品</strong>:
                <ul>
                  <li>匹配到已有型号 → 点击下拉项(自动带入预设售价)</li>
                  <li>无匹配项 → 点击下拉列表底部"未找到匹配项,将保存为新品牌型号",在弹出的确认框中按"保存"</li>
                </ul>
              </li>
              <li><strong>录入 IMEI</strong>:依次在 IMEI1 / IMEI2 / SN 三个输入框中扫码或手动输入,扫码枪录入时自动跳焦到下一字段</li>
              <li><strong>设置售出价格</strong>:匹配到已有型号时自动带入,允许修改</li>
              <li>点击<strong>添加至购物车</strong></li>
              <li><strong>结算开单</strong>:与普通销售一致,填写实收金额、客户信息(可选),点击<strong>确认开单</strong></li>
              <li>收款完成后,系统自动调后端接口新建品牌型号 + 库存记录</li>
            </ol>
            <div class="tip">无库存销售产生的库存记录会立即出现在库存查询中,后续可正常补录 IMEI2/SN(见 4.7)。</div>
          </section>
        </div>

        <!-- 第四章 -->
        <div v-show="activeChapter === 4" class="chapter glass">
          <h2 class="ch-title">四、库存管理</h2>

          <section class="sec">
            <h3 class="sec-title">4.1 库存查询</h3>
            <p><strong>门户网站查库存：</strong></p>
            <ol>
              <li>登录门户网站，点击<strong>查库存</strong></li>
              <li>在搜索框输入 IMEI 号码（可用扫码枪扫描）</li>
              <li>系统实时显示该手机的库存信息：型号、颜色、存储、IMEI 状态、所属门店</li>
            </ol>
            <p><strong>管理后台查库存：</strong></p>
            <ol>
              <li>进入管理后台 &gt; <strong>库存查询</strong></li>
              <li>支持按关键词（型号名称、条码、颜色）搜索</li>
              <li>支持按品牌、型号筛选</li>
              <li>以表格形式展示各型号的实时库存数量</li>
            </ol>
          </section>

          <section class="sec">
            <h3 class="sec-title">4.2 IMEI 库存查询</h3>
            <ol>
              <li>进入管理后台 &gt; <strong>库存查询</strong> &gt; <strong>IMEI 库存</strong></li>
              <li>可搜索条件：IMEI 号、型号名称、厂家条码</li>
              <li>查看结果包含：IMEI、IMEI2、SN 码、当前状态（在库/已售）、所属门店、入库时间</li>
            </ol>
          </section>

          <section class="sec">
            <h3 class="sec-title">4.3 期初库存录入</h3>
            <div class="role-tag">需要店长或超级管理员权限</div>
            <p>适用于新门店首次启用系统时初始化库存。</p>
            <ol>
              <li>进入管理后台 &gt; <strong>期初库存</strong></li>
              <li>选择型号，填写数量</li>
              <li>确认后系统写入库存，标记来源为"期初"</li>
              <li>支持批量录入多个型号</li>
            </ol>
          </section>

          <section class="sec">
            <h3 class="sec-title">4.4 库存盘点</h3>
            <p>用于核对实际库存与系统库存是否一致。</p>
            <p><strong>创建盘点单：</strong></p>
            <ol>
              <li>进入管理后台 &gt; <strong>库存盘点</strong></li>
              <li>点击<strong>新建盘点单</strong></li>
              <li>录入各型号的账面数量（系统自动带出）和实际盘点数量</li>
              <li>系统自动计算差异，保存盘点单（状态为"待审核"）</li>
            </ol>
            <p><strong>审核盘点单：</strong></p>
            <ol>
              <li>在盘点单列表中，找到待审核的盘点单</li>
              <li>点击<strong>审核</strong></li>
              <li>系统根据差异自动调整库存（盘盈补入、盘亏扣减）</li>
              <li>写入库存流水记录</li>
            </ol>
            <div class="warn">注意：仅可删除"待审核"状态的盘点单。审核后不可撤销，盘点前请仔细核对实盘数据。</div>
          </section>

          <section class="sec">
            <h3 class="sec-title">4.5 库存流水</h3>
            <p>查看每次库存变动的详细记录。进入管理后台 &gt; <strong>库存流水</strong>，支持按型号、变动类型筛选。</p>
            <div class="table-wrap">
              <table>
                <thead><tr><th>变动类型</th><th>含义</th></tr></thead>
                <tbody>
                  <tr><td>initial</td><td>期初录入</td></tr>
                  <tr><td>purchase_in</td><td>采购入库</td></tr>
                  <tr><td>sale_out</td><td>销售出库</td></tr>
                  <tr><td>transfer_out</td><td>调货出库</td></tr>
                  <tr><td>transfer_in</td><td>调货入库</td></tr>
                  <tr><td>transfer_cancel</td><td>调货取消回滚</td></tr>
                  <tr><td>check</td><td>盘点调整</td></tr>
                </tbody>
              </table>
            </div>
          </section>

          <section class="sec">
            <h3 class="sec-title">4.6 低库存预警</h3>
            <p>系统默认低库存阈值为 <strong>10 台</strong>。在看板和库存页面会显示低库存商品列表，库存数量低于 10 台的型号会高亮提示。</p>
          </section>

          <section class="sec">
            <h3 class="sec-title">4.7 库存查询支持 IMEI2 / SN 码搜索与补录</h3>

            <section class="sub-sec">
              <h4 class="sub-title">4.7.1 搜索范围扩展</h4>
              <ul>
                <li>搜索框支持输入：IMEI / IMEI2 / SN 码 / 商品名称 / 厂家条码</li>
                <li>搜索框 placeholder 改为：<code>搜索 IMEI / IMEI2 / SN码 / 商品名称...</code></li>
              </ul>
            </section>

            <section class="sub-sec">
              <h4 class="sub-title">4.7.2 卡片展开与补录</h4>
              <ol>
                <li>库存卡片默认展示品牌、型号、规格、IMEI</li>
                <li>点击卡片上的<strong>展开按钮</strong>，显示 IMEI2 和 SN 码</li>
                <li>若某字段为空，显示<strong>补录</strong>按钮</li>
                <li>点补录 → 行内变为输入框 → 输入后回车 → 调用后端 <code>PUT /inventory/imei/:id</code> 保存</li>
                <li>保存后卡片自动刷新，显示新值</li>
              </ol>
            </section>

            <section class="sub-sec">
              <h4 class="sub-title">4.7.3 补录数据流</h4>
              <div class="code-block">用户点击补录 → 内联输入 → PUT /inventory/imei/:id { imei2?: string, sn_code?: string }
  → 后端更新 wh_inventory_imei 表
  → 返回更新后记录 → 卡片刷新</div>
            </section>
          </section>
        </div>

        <!-- 第五章 -->
        <div v-show="activeChapter === 5" class="chapter glass">
          <h2 class="ch-title">五、销售开单</h2>

          <section class="sec">
            <h3 class="sec-title">5.1 门户网站销售开单</h3>
            <p>适合日常快速开单，操作流程简洁。</p>
            <ol>
              <li>登录门户网站，点击顶部导航的<strong>开单</strong>，或从看板点击<strong>开单</strong>快捷按钮</li>
              <li><strong>扫码添加商品</strong>：
                <ul>
                  <li>光标聚焦 IMEI 输入框</li>
                  <li>用扫码枪扫描手机上的 IMEI 条码</li>
                  <li>系统自动校验 IMEI 是否在本店且状态为在库</li>
                  <li>校验通过后自动加入购物车</li>
                </ul>
              </li>
              <li><strong>重复步骤 2</strong>，添加同单中的其他商品</li>
              <li><strong>核对购物车</strong>：检查商品名称、IMEI、价格。价格可手动调整，可删除商品</li>
              <li><strong>填写结算信息</strong>：实收金额（默认等于总价，可修改）、客户信息（可选）</li>
              <li>点击<strong>确认开单</strong></li>
              <li>系统自动生成订单编号，IMEI 标记为已售，库存扣减</li>
              <li>保存成功后，可选择<strong>打印小票</strong></li>
            </ol>
          </section>

          <section class="sec">
            <h3 class="sec-title">5.2 管理后台销售开单</h3>
            <p>功能更完整，操作流程与门户网站一致，额外支持 IMEI2 / SN 码补录等。</p>
          </section>

          <section class="sec">
            <h3 class="sec-title">5.3 IMEI 实时校验</h3>
            <p>扫码或输入 IMEI 后，系统会自动校验：</p>
            <div class="table-wrap">
              <table>
                <thead><tr><th>校验项</th><th>不通过的提示</th></tr></thead>
                <tbody>
                  <tr><td>IMEI 是否存在</td><td>"未找到该 IMEI 对应的库存"</td></tr>
                  <tr><td>IMEI 是否在本门店</td><td>"该 IMEI 不属于本店"</td></tr>
                  <tr><td>IMEI 状态是否在库</td><td>"该商品已售出"</td></tr>
                  <tr><td>IMEI 是否已在购物车</td><td>"该 IMEI 已在购物车中"</td></tr>
                </tbody>
              </table>
            </div>
          </section>

          <section class="sec">
            <h3 class="sec-title">5.4 IMEI2 / SN 码补录</h3>
            <p>如果入库时未录入 IMEI2 或 SN 码，在销售开单时可以补录：在购物车中找到该商品，点击 IMEI2 或 SN 码旁的<strong>待补录</strong>标签，输入对应编号确认即可。</p>
          </section>

          <section class="sec">
            <h3 class="sec-title">5.5 打印小票</h3>
            <p><strong>首次使用需要安装 CLodop 插件：</strong></p>
            <ol>
              <li>在需要打印的电脑上安装 CLodop 插件</li>
              <li>安装后重启浏览器</li>
              <li>系统会自动检测打印插件</li>
            </ol>
            <p><strong>打印操作：</strong>开单成功后弹出打印预览 → 点击<strong>打印</strong> → 选择打印机 → 确认打印。</p>
            <p><strong>补打小票：</strong>进入<strong>销售记录</strong>，找到需要补打的订单，点击<strong>打印</strong>按钮。</p>
          </section>

          <section class="sec">
            <h3 class="sec-title">5.6 销售记录查询</h3>
            <p><strong>门户网站：</strong>点击顶部导航的<strong>记录</strong>，按日期范围筛选（默认今日），以卡片形式展示。</p>
            <p><strong>管理后台：</strong>进入管理后台 &gt; <strong>销售记录</strong>，表格形式展示，支持查看详情和补打小票。</p>
          </section>

          <section class="sec">
            <h3 class="sec-title">5.7 无库存销售(开单场景)</h3>
            <div class="tip">与 3.6 互补 — 3.6 描述入库逻辑，5.7 描述开单完整流程。</div>

            <section class="sub-sec">
              <h4 class="sub-title">5.7.1 切换销售类型</h4>
              <ul>
                <li>在门户网站开单页顶部，新增 radio 切换：<code>普通销售</code> / <code>无库存销售</code></li>
                <li>默认 <code>普通销售</code>；切换时若购物车有商品，弹窗确认后清空</li>
              </ul>
            </section>

            <section class="sub-sec">
              <h4 class="sub-title">5.7.2 无库存销售模式</h4>
              <ul>
                <li><strong>品牌型号搜索</strong>：支持模糊搜索，无匹配时允许用户输入并保存为新品牌型号（弹 SaveBrandDialog 二次确认）</li>
                <li><strong>保存品牌型号</strong>：弹窗中按第一个空格自动分割为品牌 + 型号，用户可调整；只允许点"确认"（无取消）</li>
                <li><strong>IMEI/SN 录入</strong>：扫码枪逐字段自动跳焦</li>
                <li><strong>购物车</strong>：每个商品展示 IMEI1/IMEI2/SN，未录入字段显示[待录入]标签，点击行内编辑</li>
                <li><strong>结算</strong>：与普通销售一致（合计、实收、找零、客户信息、备注）</li>
              </ul>
            </section>

            <section class="sub-sec">
              <h4 class="sub-title">5.7.3 提交后自动建库</h4>
              <p>收款确认后，后端 <code>POST /sales/no-stock</code> 一次性完成：新建品牌型号 + 新建库存记录 + 创建销售单 + 扣减库存</p>
            </section>
          </section>
        </div>

        <!-- 第六章 -->
        <div v-show="activeChapter === 6" class="chapter glass">
          <h2 class="ch-title">六、门店调货</h2>
          <div class="role-tag">管理后台操作 · 需要店长或超级管理员权限</div>

          <section class="sec">
            <h3 class="sec-title">6.1 调货流程概述</h3>
            <p>调货是将一个门店的库存转移到另一个门店，完整流程：</p>
            <div class="flow-row">
              <span class="flow-step">发起调货申请</span>
              <span class="flow-arrow">→</span>
              <span class="flow-step">来源门店出库</span>
              <span class="flow-arrow">→</span>
              <span class="flow-step">目标门店入库</span>
              <span class="flow-arrow">→</span>
              <span class="flow-step flow-done">完成</span>
            </div>
            <div class="flow-row" style="font-size:13px;color:var(--text-tertiary);margin-top:4px;">
              <span>pending</span><span style="flex:0;margin:0 12px;">→</span>
              <span>outbound</span><span style="flex:0;margin:0 12px;">→</span>
              <span>completed</span>
            </div>
          </section>

          <section class="sec">
            <h3 class="sec-title">6.2 发起调货申请</h3>
            <ol>
              <li>进入管理后台 &gt; <strong>调货管理</strong> &gt; <strong>发起调货</strong></li>
              <li>选择<strong>目标门店</strong>、<strong>商品型号</strong>、填写<strong>数量</strong>和<strong>备注</strong>（可选）</li>
              <li>系统自动校验来源门店库存是否充足</li>
              <li>确认提交，调货单状态为"待调出"</li>
            </ol>
          </section>

          <section class="sec">
            <h3 class="sec-title">6.3 调货出库（来源门店）</h3>
            <ol>
              <li>进入管理后台 &gt; <strong>调货管理</strong></li>
              <li>找到状态为"待调出"的调货单，点击<strong>确认出库</strong></li>
              <li>系统扣减来源门店库存，状态变为"已调出"</li>
            </ol>
          </section>

          <section class="sec">
            <h3 class="sec-title">6.4 调货入库（目标门店）</h3>
            <ol>
              <li>进入管理后台 &gt; <strong>调货管理</strong></li>
              <li>找到状态为"已调出"的调货单，点击<strong>确认收货</strong></li>
              <li>系统增加目标门店库存，状态变为"已完成"</li>
            </ol>
          </section>

          <section class="sec">
            <h3 class="sec-title">6.5 取消调货</h3>
            <div class="table-wrap">
              <table>
                <thead><tr><th>调货单状态</th><th>可取消</th><th>取消后处理</th></tr></thead>
                <tbody>
                  <tr><td>待调出</td><td>是</td><td>直接取消，无库存影响</td></tr>
                  <tr><td>已调出</td><td>是</td><td>取消后自动回滚库存</td></tr>
                  <tr><td>已完成</td><td>否</td><td>不可取消，需要重新调回</td></tr>
                </tbody>
              </table>
            </div>
          </section>

          <section class="sec">
            <h3 class="sec-title">6.6 调货记录查询</h3>
            <p>进入管理后台 &gt; <strong>调货管理</strong>，可按状态（全部/待调出/已调出/已完成）或门店筛选查看。</p>
          </section>
        </div>

        <!-- 第七章 -->
        <div v-show="activeChapter === 7" class="chapter glass">
          <h2 class="ch-title">七、数据统计与看板</h2>

          <section class="sec">
            <h3 class="sec-title">7.1 门户网站数据看板</h3>
            <p>登录门户网站后，首页即为数据看板，包含以下区域：</p>
            <p><strong>统计卡片（顶部）：</strong></p>
            <div class="table-wrap">
              <table>
                <thead><tr><th>卡片</th><th>说明</th></tr></thead>
                <tbody>
                  <tr><td>今日销售额</td><td>当天所有已售订单的总金额</td></tr>
                  <tr><td>今日单数</td><td>当天完成的销售订单数量</td></tr>
                  <tr><td>低库存数量</td><td>库存低于 10 台的型号数量</td></tr>
                </tbody>
              </table>
            </div>
            <p><strong>快捷操作（中部）：</strong>入库、查库存、开单三个快捷入口。</p>
            <p><strong>图表区域（下部）：</strong>销售额趋势图（可切换 3 个月/本月/本年）、售出排行图。</p>
            <p><strong>今日最新售出记录（底部）：</strong>实时展示当天最近售出的几笔订单。</p>
          </section>

          <section class="sec">
            <h3 class="sec-title">7.2 管理后台数据看板</h3>
            <p>功能与门户网站看板类似，额外包含今日门店销售对比（超级管理员查看全部门店）。</p>
          </section>

          <section class="sec">
            <h3 class="sec-title">7.3 销售统计</h3>
            <p>进入管理后台 &gt; <strong>销售统计</strong>，支持按日/周/月维度汇总，支持自定义日期范围筛选。展示：销售额、销售单数、销售数量。</p>
          </section>

          <section class="sec">
            <h3 class="sec-title">7.4 热销排行</h3>
            <p>进入管理后台 &gt; <strong>热销排行</strong>，支持时间范围筛选，展示型号的销售数量排行。</p>
          </section>

          <section class="sec">
            <h3 class="sec-title">7.5 利润中心</h3>
            <div class="tip">用途：查看每笔销售的真实利润，辅助经营决策。</div>
            <ol>
              <li>进入管理后台 &gt; <strong>利润中心</strong></li>
              <li>选择时间范围（默认本月）</li>
              <li>表格展示每笔销售的关键列</li>
            </ol>
            <div class="table-wrap">
              <table>
                <thead>
                  <tr><th>列名</th><th>说明</th></tr>
                </thead>
                <tbody>
                  <tr><td>订单号</td><td>关联销售单</td></tr>
                  <tr><td>销售时间</td><td>下单时间</td></tr>
                  <tr><td>商品</td><td>品牌 + 型号</td></tr>
                  <tr><td>售价</td><td>实际成交价</td></tr>
                  <tr><td>成本</td><td>入库单价（无库存销售记录在销售单的 cost 字段）</td></tr>
                  <tr><td>毛利</td><td>售价 − 成本</td></tr>
                  <tr><td>毛利率</td><td>毛利 ÷ 售价 × 100%</td></tr>
                </tbody>
              </table>
            </div>
            <ol start="4">
              <li>顶部汇总：销售额、成本、毛利、毛利率</li>
              <li>点击订单号可查看销售详情</li>
              <li>导出按钮：导出当前筛选结果为 Excel</li>
            </ol>
            <div class="tip">退货订单用负值表示（售价为负、毛利为负），汇总会自动相抵。</div>
          </section>

          <section class="sec">
            <h3 class="sec-title">7.6 数据导出</h3>
            <ul>
              <li><strong>销售记录导出</strong>：管理后台 &gt; 销售记录 &gt; 右上角<strong>导出</strong> → 选时间范围 → 生成 <code>.xlsx</code></li>
              <li><strong>利润中心导出</strong>：管理后台 &gt; 利润中心 &gt; 右上角<strong>导出</strong> → 选时间范围 → 生成 <code>.xlsx</code></li>
              <li><strong>库存导出</strong>：管理后台 &gt; 库存查询 &gt; 右上角<strong>导出</strong> → 导出当前查询结果 → <code>.xlsx</code></li>
              <li>导出文件保存在浏览器的下载目录</li>
            </ul>
          </section>
        </div>

        <!-- 第八章 -->
        <div v-show="activeChapter === 8" class="chapter glass">
          <h2 class="ch-title">八、系统管理</h2>
          <div class="role-tag">管理后台操作 · 需要店长或超级管理员权限</div>

          <section class="sec">
            <h3 class="sec-title">8.1 用户管理</h3>
            <p><strong>新增用户：</strong></p>
            <ol>
              <li>进入管理后台 &gt; <strong>用户管理</strong> &gt; <strong>新增用户</strong></li>
              <li>填写：用户名、密码、真实姓名、角色、所属门店</li>
              <li>点击<strong>确认</strong>保存</li>
            </ol>
            <p><strong>编辑/启用禁用/重置密码：</strong></p>
            <ul>
              <li>在用户列表中找到目标用户，点击对应操作按钮</li>
              <li>禁用后该用户无法登录系统</li>
              <li>重置密码后用户下次登录使用新密码</li>
            </ul>
            <p><strong>权限可见性：</strong>店员只能看到店员用户，店长可以看到店员和店长，超级管理员看到所有用户。</p>
          </section>

          <section class="sec">
            <h3 class="sec-title">8.2 门店管理</h3>
            <div class="role-tag">仅超级管理员可操作</div>
            <p>进入管理后台 &gt; <strong>门店管理</strong>，可新增、编辑、删除门店。</p>
            <ul>
              <li>门店编码用于生成订单编号前缀（如 <code>A-SA-20260617-0001</code>）</li>
              <li>删除门店前需确保门店下无用户</li>
            </ul>
          </section>

          <section class="sec">
            <h3 class="sec-title">8.3 数据工具(已扩充)</h3>
            <div class="warn">谨慎使用！数据工具用于处理异常数据，仅超级管理员可操作。</div>

            <section class="sub-sec">
              <h4 class="sub-title">8.3.1 IMEI 数据清理</h4>
              <ul>
                <li><strong>用途</strong>：删除异常/重复 IMEI 记录</li>
                <li><strong>操作</strong>：输入 IMEI → 系统查找匹配记录 → 确认删除</li>
                <li><strong>影响</strong>：相关销售单 IMEI 字段清空(订单不删除)</li>
              </ul>
            </section>

            <section class="sub-sec">
              <h4 class="sub-title">8.3.2 库存数据修正</h4>
              <ul>
                <li><strong>用途</strong>：手动调整某型号的库存数量(增减)</li>
                <li><strong>操作</strong>：选择型号 → 输入调整数量(正/负) → 填写原因 → 提交</li>
                <li><strong>影响</strong>：写入库存流水表(adjustment 类型),库存数量立即更新</li>
              </ul>
            </section>

            <section class="sub-sec">
              <h4 class="sub-title">8.3.3 数据库备份</h4>
              <ul>
                <li><strong>用途</strong>：导出完整数据库快照</li>
                <li><strong>操作</strong>：点击<strong>立即备份</strong> → 下载 <code>.sql</code> 文件</li>
                <li><strong>建议</strong>：每周至少备份一次,重要数据操作前手动备份</li>
              </ul>
            </section>

            <section class="sub-sec">
              <h4 class="sub-title">8.3.4 操作建议</h4>
              <p>建议在进行数据操作前先备份数据库文件;操作后用销售记录/库存查询验证数据正确性。</p>
            </section>
          </section>

          <section class="sec">
            <h3 class="sec-title">8.4 操作审计日志</h3>

            <section class="sub-sec">
              <h4 class="sub-title">8.4.1 查看审计日志</h4>
              <ol>
                <li>进入管理后台 &gt; <strong>审计日志</strong></li>
                <li>按时间范围筛选(默认近 7 天)</li>
                <li>支持按用户、操作类型、目标类型筛选</li>
                <li>表格展示：时间、用户、操作、目标、详情</li>
              </ol>
            </section>

            <section class="sub-sec">
              <h4 class="sub-title">8.4.2 记录的操作类型</h4>
              <div class="table-wrap">
                <table>
                  <thead>
                    <tr><th>操作类型</th><th>说明</th></tr>
                  </thead>
                  <tbody>
                    <tr><td>登录/登出</td><td>用户登录和登出事件</td></tr>
                    <tr><td>新增/编辑/删除</td><td>用户、门店、品牌、型号的 CRUD</td></tr>
                    <tr><td>库存调整</td><td>数据工具中的库存调整</td></tr>
                    <tr><td>备份</td><td>数据库备份事件</td></tr>
                    <tr><td>权限变更</td><td>角色和权限的调整</td></tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section class="sub-sec">
              <h4 class="sub-title">8.4.3 审计字段</h4>
              <ul>
                <li><strong>操作人</strong>：当前登录用户</li>
                <li><strong>时间</strong>：精确到秒</li>
                <li><strong>目标类型</strong>：user / store / brand / model / inventory / backup</li>
                <li><strong>目标 ID</strong>：被操作对象的 ID</li>
                <li><strong>变更前 / 变更后</strong>：JSON 格式,展示关键字段差异</li>
              </ul>
              <div class="tip">审计日志只增不改不删,保留至少 90 天。</div>
            </section>
          </section>
        </div>

        <!-- 第九章 -->
        <div v-show="activeChapter === 9" class="chapter glass">
          <h2 class="ch-title">九、常见问题与故障排除</h2>

          <section class="sec">
            <h3 class="sec-title">9.1 登录问题</h3>
            <div class="qa-item">
              <div class="qa-q">Q：忘记密码怎么办？</div>
              <div class="qa-a">联系店长或超级管理员，在<strong>用户管理</strong>中重置密码。</div>
            </div>
            <div class="qa-item">
              <div class="qa-q">Q：登录提示"账号已禁用"</div>
              <div class="qa-a">联系店长确认是否账号被禁用。如刚离职员工可能会被禁用账号。</div>
            </div>
            <div class="qa-item">
              <div class="qa-q">Q：登录后看不到任何数据</div>
              <div class="qa-a">确认账号已绑定门店（超级管理员需手动切换门店），联系系统管理员检查账号权限。</div>
            </div>
          </section>

          <section class="sec">
            <h3 class="sec-title">9.2 IMEI 相关问题</h3>
            <div class="qa-item">
              <div class="qa-q">Q：扫码枪扫码后无反应</div>
              <div class="qa-a">检查光标是否在 IMEI 输入框中。检查扫码枪是否连接正常（打开记事本测试扫码）。检查 IMEI 条码是否清晰完整。</div>
            </div>
            <div class="qa-item">
              <div class="qa-q">Q：提示"IMEI 已存在"</div>
              <div class="qa-a">该 IMEI 已经在系统中存在，可能是重复扫码。核对实物手机上的 IMEI 编号。</div>
            </div>
            <div class="qa-item">
              <div class="qa-q">Q：提示"IMEI 已售出"</div>
              <div class="qa-a">该手机已经在销售记录中，检查是否误操作或扫码了已售手机的包装盒。</div>
            </div>
            <div class="qa-item">
              <div class="qa-q">Q：提示"未找到该 IMEI 对应的库存"</div>
              <div class="qa-a">该 IMEI 不在本门店库存中。可能是其他门店的库存，或该 IMEI 从未入库。</div>
            </div>
          </section>

          <section class="sec">
            <h3 class="sec-title">9.3 库存不一致</h3>
            <div class="qa-item">
              <div class="qa-q">Q：实际库存和系统库存对不上</div>
              <div class="qa-a">
                1. 进入<strong>库存流水</strong>查看最近变动记录<br>
                2. 核对是否有误操作（如重复入库、出库未成功等）<br>
                3. 进行<strong>库存盘点</strong>，以实际盘点数为准审核调整
              </div>
            </div>
            <div class="qa-item">
              <div class="qa-q">Q：调货后库存未更新</div>
              <div class="qa-a">
                1. 检查调货单状态是否已完成<br>
                2. 如果状态为"已调出"但未收到，联系目标门店操作"确认收货"<br>
                3. 如果状态为"待调出"，进行"确认出库"操作
              </div>
            </div>
          </section>

          <section class="sec">
            <h3 class="sec-title">9.4 打印问题</h3>
            <div class="qa-item">
              <div class="qa-q">Q：点击打印没反应</div>
              <div class="qa-a">确认电脑上已安装 CLodop 插件且服务正在运行（桌面右下角有图标），重启浏览器后重试。</div>
            </div>
            <div class="qa-item">
              <div class="qa-q">Q：打印内容排版错乱或缺字</div>
              <div class="qa-a">确认使用 CLodop 支持的打印机，检查打印机是否缺纸或碳带，联系技术人员调整参数。</div>
            </div>
          </section>

          <section class="sec">
            <h3 class="sec-title">9.5 调货异常</h3>
            <div class="qa-item">
              <div class="qa-q">Q：发起调货提示"库存不足"</div>
              <div class="qa-a">确认来源门店的该型号库存数量是否足够，检查是否有其他未完成的调货单占用了库存。</div>
            </div>
            <div class="qa-item">
              <div class="qa-q">Q：调货后想取消</div>
              <div class="qa-a">
                - "待调出"状态：直接取消，无影响<br>
                - "已调出"状态：取消后库存自动回滚<br>
                - "已完成"状态：无法取消，需要重新调回
              </div>
            </div>
          </section>

          <section class="sec">
            <h3 class="sec-title">9.6 数据工具使用场景</h3>
            <p>以下情况可联系超级管理员使用数据工具处理：</p>
            <ul>
              <li>因误操作导致的大量重复 IMEI 数据</li>
              <li>需要批量修正库存数据</li>
              <li>系统测试数据清理</li>
            </ul>
            <div class="warn">数据工具操作不可逆，操作前请务必备份数据库。</div>
          </section>

          <section class="sec">
            <h3 class="sec-title">9.7 其他常见问题</h3>

            <section class="sub-sec">
              <h4 class="sub-title">9.7.1 网络与连接</h4>
              <div class="qa-item">
                <div class="qa-q">Q：扫码枪无法识别条码？</div>
                <div class="qa-a">A：检查 USB 是否插好；确认扫码枪设置为"USB 键盘模式"；在记事本扫码验证扫码枪本身；刷新页面重试。</div>
              </div>
              <div class="qa-item">
                <div class="qa-q">Q：网络断线导致数据未保存？</div>
                <div class="qa-a">A：销售单提交失败会提示错误，数据不会丢失。网络恢复后重试即可；严重时联系管理员检查数据库连接。</div>
              </div>
              <div class="qa-item">
                <div class="qa-q">Q：浏览器提示"连接不安全"？</div>
                <div class="qa-a">A：确认访问地址是 <code>http://localhost:5173</code>(门户网站)或 <code>http://localhost:5174</code>(管理后台)。内网部署也用 HTTP。</div>
              </div>
            </section>

            <section class="sub-sec">
              <h4 class="sub-title">9.7.2 性能问题</h4>
              <div class="qa-item">
                <div class="qa-q">Q：库存列表加载慢？</div>
                <div class="qa-a">A：通常因为库存数量大(> 5000 条)。使用搜索框定位特定型号，避免全量加载；联系管理员考虑分页/索引优化。</div>
              </div>
              <div class="qa-item">
                <div class="qa-q">Q：销售开单提交慢？</div>
                <div class="qa-a">A：检查网络延迟；同时开单用户过多会排队，稍等重试。</div>
              </div>
            </section>

            <section class="sub-sec">
              <h4 class="sub-title">9.7.3 数据同步</h4>
              <div class="qa-item">
                <div class="qa-q">Q：门户网站与管理后台数据不一致？</div>
                <div class="qa-a">A：浏览器缓存问题：硬刷新(<code>Ctrl+Shift+R</code>)；数据写入失败：检查后端日志；数据延迟：等 1-2 分钟或手动刷新。</div>
              </div>
            </section>
          </section>

          <section class="sec">
            <h3 class="sec-title">9.8 使用建议</h3>

            <section class="sub-sec">
              <h4 class="sub-title">9.8.1 日常操作</h4>
              <ul>
                <li><strong>入库时</strong>：录入 IMEI 后立即按回车添加，逐台确认</li>
                <li><strong>销售时</strong>：扫码前先选好商品，再录 IMEI，避免混淆</li>
                <li><strong>盘点时</strong>：使用批量扫码，先扫满一批再提交</li>
                <li><strong>日结时</strong>：每天下班前打印当日销售汇总，核对销售单数与现金</li>
              </ul>
            </section>

            <section class="sub-sec">
              <h4 class="sub-title">9.8.2 性能与数据</h4>
              <ul>
                <li>库存数据超过 5000 条时，使用搜索功能避免全量加载</li>
                <li>每月至少导出一次销售数据作为备份</li>
                <li>重要操作(数据工具、批量删除)前先备份数据库</li>
              </ul>
            </section>

            <section class="sub-sec">
              <h4 class="sub-title">9.8.3 常见误区</h4>
              <ul>
                <li><strong>不要</strong>用销售开单作为入库途径(请用"无库存销售"或先入库再销售)</li>
                <li><strong>不要</strong>多人同时编辑同一品牌型号(可能产生覆盖，后写入的胜出)</li>
                <li><strong>不要</strong>删除有销售记录的品牌型号(会导致销售单显示异常)</li>
              </ul>
              <div class="tip">有未覆盖的问题请联系系统管理员，持续更新本文档。</div>
            </section>
          </section>
        </div>
        <div v-show="activeChapter === 10" class="chapter glass">
          <h2 class="ch-title">十、售后记录</h2>

          <section class="sec">
            <h3 class="sec-title">10.1 售后记录的概念</h3>
            <div class="tip">售后记录用于跟踪手机售出后的维修、换机、退货等售后服务情况，与销售单关联，但不直接修改销售单数据。</div>
          </section>

          <section class="sec">
            <h3 class="sec-title">10.2 售后记录的核心字段</h3>
            <div class="table-wrap">
              <table>
                <thead>
                  <tr><th>字段</th><th>说明</th></tr>
                </thead>
                <tbody>
                  <tr><td>售后单号</td><td>自动生成，格式 <code>AS-YYYYMMDD-NNNN</code></td></tr>
                  <tr><td>关联销售单</td><td>对应原销售单(必填)</td></tr>
                  <tr><td>客户姓名/电话</td><td>冗余存储，便于查找</td></tr>
                  <tr><td>商品信息</td><td>品牌、型号、IMEI(从销售单复制)</td></tr>
                  <tr><td>售后类型</td><td>维修 / 换机 / 退货 / 其他</td></tr>
                  <tr><td>问题描述</td><td>客户反馈的问题</td></tr>
                  <tr><td>处理结果</td><td>处理过程记录</td></tr>
                  <tr><td>状态</td><td>处理中 / 已完成 / 已取消</td></tr>
                  <tr><td>费用</td><td>实际产生的费用(可为 0)</td></tr>
                  <tr><td>处理人</td><td>售后处理人(用户)</td></tr>
                  <tr><td>创建时间</td><td>售后单创建时间</td></tr>
                  <tr><td>完成时间</td><td>售后单完成时间(状态变为已完成时)</td></tr>
                </tbody>
              </table>
            </div>
          </section>

          <section class="sec">
            <h3 class="sec-title">10.3 创建售后记录</h3>

            <section class="sub-sec">
              <h4 class="sub-title">10.3.1 从销售单发起(推荐)</h4>
              <ol>
                <li>进入管理后台 &gt; <strong>销售记录</strong></li>
                <li>找到需要售后的销售单，点击<strong>详情</strong></li>
                <li>在详情页底部，点击<strong>创建售后记录</strong></li>
                <li>系统自动填充商品信息、IMEI、客户信息</li>
                <li>填写售后类型、问题描述、费用(可选)</li>
                <li>点击<strong>保存</strong> → 售后单创建成功</li>
              </ol>
            </section>

            <section class="sub-sec">
              <h4 class="sub-title">10.3.2 售后模块独立创建</h4>
              <ol>
                <li>进入管理后台 &gt; <strong>售后记录</strong></li>
                <li>点击<strong>新建售后单</strong></li>
                <li>选择关联销售单(必填)</li>
                <li>手动填写其他字段</li>
                <li>点击<strong>保存</strong></li>
              </ol>
            </section>
          </section>

          <section class="sec">
            <h3 class="sec-title">10.4 售后状态管理</h3>
            <div class="table-wrap">
              <table>
                <thead>
                  <tr><th>状态</th><th>说明</th><th>可执行操作</th></tr>
                </thead>
                <tbody>
                  <tr><td>处理中</td><td>售后单刚创建，正在处理</td><td>编辑、完成、取消</td></tr>
                  <tr><td>已完成</td><td>售后处理完成</td><td>查看详情、打印凭证</td></tr>
                  <tr><td>已取消</td><td>售后单作废</td><td>查看详情</td></tr>
                </tbody>
              </table>
            </div>
            <ul>
              <li>状态从<strong>处理中 → 已完成</strong>：填写处理结果(必填)，系统记录完成时间</li>
              <li>状态从<strong>处理中 → 已取消</strong>：填写取消原因(必填)，售后单不参与统计</li>
            </ul>
          </section>

          <section class="sec">
            <h3 class="sec-title">10.5 售后统计与查询</h3>

            <section class="sub-sec">
              <h4 class="sub-title">10.5.1 查询</h4>
              <ol>
                <li>进入管理后台 &gt; <strong>售后记录</strong></li>
                <li>支持按时间范围、状态、售后类型、处理人筛选</li>
                <li>支持搜索：客户姓名、电话、IMEI、售后单号</li>
              </ol>
            </section>

            <section class="sub-sec">
              <h4 class="sub-title">10.5.2 统计</h4>
              <ul>
                <li>顶部卡片：今日售后单数、处理中数量、本月售后数</li>
                <li>表格底部：按售后类型汇总(维修 N 单 / 换机 M 单 / 退货 K 单)</li>
                <li>支持按时间范围导出</li>
              </ul>
            </section>

            <section class="sub-sec">
              <h4 class="sub-title">10.5.3 与销售单的关系</h4>
              <ul>
                <li>售后单<strong>不修改</strong>原销售单(销售单金额、IMEI 等保持不变)</li>
                <li>销售单详情页底部展示<strong>所有关联售后单</strong>(列表形式)</li>
                <li>同一销售单可创建<strong>多个</strong>售后单(支持多次维修)</li>
              </ul>
            </section>
          </section>

          <section class="sec">
            <h3 class="sec-title">10.6 售后费用处理</h3>
            <div class="tip">售后费用需要单独走财务流程，不在销售金额中自动扣减。</div>
            <ul>
              <li>售后单上的<strong>费用</strong>字段仅用于记录</li>
              <li>实际收款/退款由门店自行处理</li>
              <li>若涉及退款，需在系统中创建<strong>退货销售单</strong>(售价为负)</li>
              <li>售后单与退货销售单互不强制关联，通过手工记录对齐</li>
            </ul>
          </section>

          <section class="sec">
            <h3 class="sec-title">10.7 售后记录的最佳实践</h3>
            <ul>
              <li><strong>及时创建</strong>：客户反馈问题当天就创建售后单，避免遗忘</li>
              <li><strong>问题描述具体</strong>：写清楚故障现象，便于工程师判断</li>
              <li><strong>处理过程留痕</strong>：在"处理结果"中记录处理步骤、换件情况、客户沟通要点</li>
              <li><strong>客户信息冗余存储</strong>：即使客户换号，售后单仍可查询</li>
              <li><strong>定期回访</strong>：已完成的售后单，可定期回访客户使用情况</li>
              <li><strong>数据分析</strong>：通过售后统计发现高频问题机型，反馈给采购</li>
            </ul>
            <div class="tip">售后记录是客户关系的重要数据，务必认真填写。</div>
          </section>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const activeChapter = ref(1)

const chapters = [
  { id: 1, label: '系统入门' },
  { id: 2, label: '基础数据管理' },
  { id: 3, label: '采购入库' },
  { id: 4, label: '库存管理' },
  { id: 5, label: '销售开单' },
  { id: 6, label: '门店调货' },
  { id: 7, label: '数据统计与看板' },
  { id: 8, label: '系统管理' },
  { id: 9, label: '常见问题' },
  { id: 10, label: '售后记录' },
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

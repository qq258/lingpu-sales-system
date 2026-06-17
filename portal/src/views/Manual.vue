<template>
  <div class="page-container">
    <div class="page-title-row">
      <h1 class="page-title">使用手册</h1>
      <span class="title-line"></span>
      <span class="badge">v1.0</span>
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
            <h3 class="sec-title">8.3 数据工具</h3>
            <div class="warn">谨慎使用！数据工具用于处理异常数据，仅超级管理员可操作。建议操作前先备份数据库文件。</div>
            <p>适用场景：IMEI 数据清理、库存数据修正、其他数据维护操作。</p>
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

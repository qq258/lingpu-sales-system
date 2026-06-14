-- CreateTable
CREATE TABLE "sys_store" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "address" TEXT,
    "phone" TEXT,
    "status" INTEGER NOT NULL DEFAULT 1,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "sys_user" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "real_name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'operator',
    "store_id" INTEGER,
    "status" INTEGER NOT NULL DEFAULT 1,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "sys_user_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "sys_store" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "sys_operation_log" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "store_id" INTEGER,
    "action" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "target_id" INTEGER,
    "detail" TEXT,
    "ip" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "sys_operation_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "sys_user" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "sys_operation_log_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "sys_store" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "pdt_brand" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" INTEGER NOT NULL DEFAULT 1,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "pdt_model" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "brand_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "ram" TEXT,
    "rom" TEXT,
    "sale_price" REAL NOT NULL,
    "cost_price" REAL,
    "manufacturer_barcode" TEXT,
    "image_path" TEXT,
    "launch_year" INTEGER,
    "os_type" TEXT,
    "network_type" TEXT,
    "screen_size" TEXT,
    "cpu" TEXT,
    "battery" TEXT,
    "description" TEXT,
    "status" INTEGER NOT NULL DEFAULT 1,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pdt_model_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "pdt_brand" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "pch_supplier" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "contact_person" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "remark" TEXT,
    "status" INTEGER NOT NULL DEFAULT 1,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "pch_purchase_entry" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "entry_no" TEXT NOT NULL,
    "store_id" INTEGER NOT NULL,
    "supplier_id" INTEGER,
    "total_amount" REAL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "operator_id" INTEGER NOT NULL,
    "remark" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" DATETIME,
    CONSTRAINT "pch_purchase_entry_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "sys_store" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "pch_purchase_entry_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "pch_supplier" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "pch_purchase_entry_operator_id_fkey" FOREIGN KEY ("operator_id") REFERENCES "sys_user" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "pch_purchase_item" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "entry_id" INTEGER NOT NULL,
    "model_id" INTEGER NOT NULL,
    "imei" TEXT NOT NULL,
    "imei2" TEXT,
    "sn_code" TEXT,
    "unit_price" REAL NOT NULL,
    "subtotal" REAL,
    CONSTRAINT "pch_purchase_item_entry_id_fkey" FOREIGN KEY ("entry_id") REFERENCES "pch_purchase_entry" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "pch_purchase_item_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "pdt_model" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "wh_inventory" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "model_id" INTEGER NOT NULL,
    "store_id" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "brand_name" TEXT,
    "model_name" TEXT,
    "color" TEXT,
    "storage" TEXT,
    "cost_price" REAL,
    "sale_price" REAL,
    CONSTRAINT "wh_inventory_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "pdt_model" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "wh_inventory_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "sys_store" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "wh_inventory_log" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "model_id" INTEGER NOT NULL,
    "store_id" INTEGER NOT NULL,
    "change_type" TEXT NOT NULL,
    "qty_before" INTEGER NOT NULL,
    "qty_change" INTEGER NOT NULL,
    "qty_after" INTEGER NOT NULL,
    "ref_type" TEXT,
    "ref_id" INTEGER,
    "remark" TEXT,
    "operator_id" INTEGER,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "wh_inventory_log_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "pdt_model" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "wh_inventory_log_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "sys_store" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "wh_inventory_log_operator_id_fkey" FOREIGN KEY ("operator_id") REFERENCES "sys_user" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "wh_inventory_imei" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "model_id" INTEGER NOT NULL,
    "store_id" INTEGER NOT NULL,
    "imei" TEXT NOT NULL,
    "imei2" TEXT,
    "sn_code" TEXT,
    "status" TEXT NOT NULL DEFAULT 'in_stock',
    "entry_id" INTEGER,
    "sold_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "wh_inventory_imei_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "pdt_model" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "wh_inventory_imei_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "sys_store" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "wh_inventory_check" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "check_no" TEXT NOT NULL,
    "store_id" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "checker_id" INTEGER NOT NULL,
    "check_time" DATETIME,
    "remark" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "wh_inventory_check_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "sys_store" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "wh_inventory_check_checker_id_fkey" FOREIGN KEY ("checker_id") REFERENCES "sys_user" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "wh_inventory_check_item" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "check_id" INTEGER NOT NULL,
    "model_id" INTEGER NOT NULL,
    "expected_qty" INTEGER NOT NULL,
    "actual_qty" INTEGER NOT NULL,
    "diff_qty" INTEGER,
    CONSTRAINT "wh_inventory_check_item_check_id_fkey" FOREIGN KEY ("check_id") REFERENCES "wh_inventory_check" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "wh_inventory_check_item_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "pdt_model" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "sale_order" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "order_no" TEXT NOT NULL,
    "store_id" INTEGER NOT NULL,
    "model_id" INTEGER NOT NULL,
    "model_name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_price" REAL NOT NULL,
    "total_amount" REAL,
    "actual_amount" REAL NOT NULL,
    "change_amount" REAL,
    "customer_name" TEXT,
    "customer_address" TEXT,
    "customer_phone" TEXT,
    "remark" TEXT,
    "operator_id" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "sale_order_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "sys_store" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "sale_order_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "pdt_model" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "sale_order_operator_id_fkey" FOREIGN KEY ("operator_id") REFERENCES "sys_user" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "sale_order_item" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "sale_order_id" INTEGER NOT NULL,
    "model_id" INTEGER NOT NULL,
    "model_name" TEXT NOT NULL,
    "imei" TEXT,
    "imei2" TEXT,
    "sn_code" TEXT,
    "quantity" INTEGER NOT NULL,
    "unit_price" REAL NOT NULL,
    "total_price" REAL NOT NULL,
    CONSTRAINT "sale_order_item_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "pdt_model" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "sale_order_item_sale_order_id_fkey" FOREIGN KEY ("sale_order_id") REFERENCES "sale_order" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "wh_transfer" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "transfer_no" TEXT NOT NULL,
    "from_store_id" INTEGER NOT NULL,
    "to_store_id" INTEGER NOT NULL,
    "model_id" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "applicant_id" INTEGER NOT NULL,
    "outbound_operator_id" INTEGER,
    "inbound_operator_id" INTEGER,
    "remark" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "outbound_at" DATETIME,
    "inbound_at" DATETIME,
    CONSTRAINT "wh_transfer_from_store_id_fkey" FOREIGN KEY ("from_store_id") REFERENCES "sys_store" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "wh_transfer_to_store_id_fkey" FOREIGN KEY ("to_store_id") REFERENCES "sys_store" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "wh_transfer_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "pdt_model" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "wh_transfer_applicant_id_fkey" FOREIGN KEY ("applicant_id") REFERENCES "sys_user" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "wh_transfer_outbound_operator_id_fkey" FOREIGN KEY ("outbound_operator_id") REFERENCES "sys_user" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "wh_transfer_inbound_operator_id_fkey" FOREIGN KEY ("inbound_operator_id") REFERENCES "sys_user" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "sys_store_name_key" ON "sys_store"("name");

-- CreateIndex
CREATE UNIQUE INDEX "sys_store_code_key" ON "sys_store"("code");

-- CreateIndex
CREATE UNIQUE INDEX "sys_user_username_key" ON "sys_user"("username");

-- CreateIndex
CREATE UNIQUE INDEX "pdt_brand_name_key" ON "pdt_brand"("name");

-- CreateIndex
CREATE UNIQUE INDEX "pdt_model_manufacturer_barcode_key" ON "pdt_model"("manufacturer_barcode");

-- CreateIndex
CREATE INDEX "pdt_model_brand_id_idx" ON "pdt_model"("brand_id");

-- CreateIndex
CREATE INDEX "pdt_model_name_idx" ON "pdt_model"("name");

-- CreateIndex
CREATE INDEX "pdt_model_manufacturer_barcode_idx" ON "pdt_model"("manufacturer_barcode");

-- CreateIndex
CREATE UNIQUE INDEX "pch_purchase_entry_entry_no_key" ON "pch_purchase_entry"("entry_no");

-- CreateIndex
CREATE INDEX "pch_purchase_entry_store_id_idx" ON "pch_purchase_entry"("store_id");

-- CreateIndex
CREATE INDEX "pch_purchase_entry_supplier_id_idx" ON "pch_purchase_entry"("supplier_id");

-- CreateIndex
CREATE INDEX "pch_purchase_entry_entry_no_idx" ON "pch_purchase_entry"("entry_no");

-- CreateIndex
CREATE INDEX "pch_purchase_item_entry_id_idx" ON "pch_purchase_item"("entry_id");

-- CreateIndex
CREATE INDEX "pch_purchase_item_model_id_idx" ON "pch_purchase_item"("model_id");

-- CreateIndex
CREATE INDEX "pch_purchase_item_imei_idx" ON "pch_purchase_item"("imei");

-- CreateIndex
CREATE UNIQUE INDEX "wh_inventory_model_id_store_id_key" ON "wh_inventory"("model_id", "store_id");

-- CreateIndex
CREATE INDEX "wh_inventory_log_model_id_store_id_idx" ON "wh_inventory_log"("model_id", "store_id");

-- CreateIndex
CREATE INDEX "wh_inventory_log_change_type_idx" ON "wh_inventory_log"("change_type");

-- CreateIndex
CREATE INDEX "wh_inventory_log_created_at_idx" ON "wh_inventory_log"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "wh_inventory_imei_imei_key" ON "wh_inventory_imei"("imei");

-- CreateIndex
CREATE INDEX "wh_inventory_imei_sn_code_idx" ON "wh_inventory_imei"("sn_code");

-- CreateIndex
CREATE UNIQUE INDEX "wh_inventory_check_check_no_key" ON "wh_inventory_check"("check_no");

-- CreateIndex
CREATE UNIQUE INDEX "sale_order_order_no_key" ON "sale_order"("order_no");

-- CreateIndex
CREATE INDEX "sale_order_store_id_idx" ON "sale_order"("store_id");

-- CreateIndex
CREATE INDEX "sale_order_created_at_idx" ON "sale_order"("created_at");

-- CreateIndex
CREATE INDEX "sale_order_order_no_idx" ON "sale_order"("order_no");

-- CreateIndex
CREATE INDEX "sale_order_item_sale_order_id_idx" ON "sale_order_item"("sale_order_id");

-- CreateIndex
CREATE UNIQUE INDEX "wh_transfer_transfer_no_key" ON "wh_transfer"("transfer_no");

-- CreateIndex
CREATE INDEX "wh_transfer_from_store_id_idx" ON "wh_transfer"("from_store_id");

-- CreateIndex
CREATE INDEX "wh_transfer_to_store_id_idx" ON "wh_transfer"("to_store_id");

-- CreateIndex
CREATE INDEX "wh_transfer_status_idx" ON "wh_transfer"("status");

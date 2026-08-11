-- CreateTable
CREATE TABLE "sys_role_menu" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "role" TEXT NOT NULL,
    "menu_keys" TEXT NOT NULL DEFAULT '[]',
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "sys_role_menu_role_key" ON "sys_role_menu"("role");

#!/bin/bash

# @waitingliou/ts-otel-weaver 發布準備腳本
# 使用方式: ./scripts/prepare-release.sh

set -e

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 @waitingliou/ts-otel-weaver 發布準備${NC}"
echo "========================================"

# 1. 檢查 Git 狀態
echo -e "${BLUE}📋 檢查 Git 狀態...${NC}"
if [ -n "$(git status --porcelain)" ]; then
    echo -e "${RED}❌ 工作目錄有未提交的變更${NC}"
    git status --short
    exit 1
fi

CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
    echo -e "${YELLOW}⚠️  當前分支: $CURRENT_BRANCH (建議在 main 分支發布)${NC}"
fi

# 2. 更新依賴
echo -e "${BLUE}📦 更新依賴...${NC}"
npm ci

# 3. 執行完整測試
echo -e "${BLUE}🧪 執行完整測試...${NC}"
npm test

# 4. 執行建置
echo -e "${BLUE}🔨 執行建置...${NC}"
npm run build

# 5. 檢查 package.json
echo -e "${BLUE}📋 檢查 package.json...${NC}"
PACKAGE_NAME=$(node -p "require('./package.json').name")
CURRENT_VERSION=$(node -p "require('./package.json').version")
DESCRIPTION=$(node -p "require('./package.json').description")

echo "  Package: $PACKAGE_NAME"
echo "  Version: $CURRENT_VERSION"
echo "  Description: $DESCRIPTION"

# 6. 驗證 exports
echo -e "${BLUE}🔍 驗證 package exports...${NC}"
if node -e "console.log(require.resolve('./dist/index.js'))" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Main export 正常${NC}"
else
    echo -e "${RED}❌ Main export 失敗${NC}"
    exit 1
fi

if node -e "console.log(require.resolve('./dist/transformer/index.js'))" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Transformer export 正常${NC}"
else
    echo -e "${RED}❌ Transformer export 失敗${NC}"
    exit 1
fi

# 7. 檢查必要檔案
echo -e "${BLUE}📁 檢查必要檔案...${NC}"
REQUIRED_FILES=("README.md" "LICENSE" "package.json")

for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅ $file${NC}"
    else
        echo -e "${RED}❌ $file 遺失${NC}"
        exit 1
    fi
done

# 8. 檢查 npm 登入狀態
echo -e "${BLUE}👤 檢查 npm 登入狀態...${NC}"
if npm whoami > /dev/null 2>&1; then
    NPM_USER=$(npm whoami)
    echo -e "${GREEN}✅ npm 已登入: $NPM_USER${NC}"
else
    echo -e "${RED}❌ 請先登入 npm: npm login${NC}"
    exit 1
fi

# 9. 檢查發布權限
echo -e "${BLUE}🔒 檢查發布權限...${NC}"
if npm access list packages | grep -q "$PACKAGE_NAME" 2>/dev/null; then
    echo -e "${GREEN}✅ 有發布權限${NC}"
else
    echo -e "${YELLOW}⚠️  無法確認發布權限，首次發布？${NC}"
fi

# 10. 預覽發布內容
echo -e "${BLUE}📦 預覽發布內容...${NC}"
npm pack --dry-run

# 11. 最終確認
echo -e "${YELLOW}🎯 發布前最終檢查${NC}"
echo "=============================="
echo "Package: $PACKAGE_NAME"
echo "Version: $CURRENT_VERSION"
echo "Branch: $CURRENT_BRANCH"
echo "User: $NPM_USER"
echo ""
echo "準備發布到:"
echo "- GitHub: https://github.com/Lu-weiting/ts-opentelemetry-weaver"
echo "- npm: https://www.npmjs.com/package/@waitingliou/ts-otel-weaver"
echo ""

# 12. 生成發布命令
echo -e "${GREEN}✅ 準備完成！${NC}"
echo ""
echo -e "${BLUE}📝 發布步驟：${NC}"
echo "1. 更新版本: npm version [patch|minor|major]"
echo "2. 推送標籤: git push origin --tags"
echo "3. 發布到 npm: npm publish"
echo "4. 建立 GitHub Release"
echo ""
echo -e "${BLUE}🚀 快速發布命令：${NC}"
echo "npm version patch && git push origin main --tags && npm publish"
echo ""
echo -e "${YELLOW}💡 提示：${NC}"
echo "- 使用 'npm version patch' 進行 bug 修復"
echo "- 使用 'npm version minor' 進行新功能"
echo "- 使用 'npm version major' 進行重大變更"
echo ""
echo -e "${GREEN}🎉 發布準備完成！${NC}"

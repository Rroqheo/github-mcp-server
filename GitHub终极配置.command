#!/bin/bash

# GitHub终极配置脚本 - 双击运行版本
# 用户: Rroqheo
# 系统: macOS
# 功能: 一键完成GitHub满血配置

# 设置错误处理
set -e
trap 'echo "❌ 脚本执行出错，请检查错误信息"; read -p "按回车键退出..." dummy; exit 1' ERR

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

# 打印函数
print_header() {
    clear
    echo -e "${BOLD}${CYAN}"
    echo "=================================================================="
    echo "🚀 GitHub终极配置脚本 - 双击运行版"
    echo "=================================================================="
    echo -e "${NC}"
    echo -e "${BLUE}专为 Rroqheo 定制的GitHub满血配置方案${NC}"
    echo -e "${YELLOW}⚠️  请确保您有管理员权限和稳定的网络连接${NC}"
    echo
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# 检查系统
check_system() {
    print_info "检查系统环境..."
    
    if [[ "$OSTYPE" == "darwin"* ]]; then
        print_success "检测到 macOS 系统"
        OS="macos"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        print_success "检测到 Linux 系统"
        OS="linux"
    else
        print_error "不支持的操作系统: $OSTYPE"
        exit 1
    fi
    
    # 检查网络连接
    if ping -c 1 github.com &> /dev/null; then
        print_success "网络连接正常"
    else
        print_error "无法连接到GitHub，请检查网络"
        exit 1
    fi
}

# 安装必要工具
install_tools() {
    print_info "检查并安装必要工具..."
    
    # 检查并安装 Homebrew (macOS)
    if [[ "$OS" == "macos" ]]; then
        if ! command -v brew &> /dev/null; then
            print_info "安装 Homebrew..."
            /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
            print_success "Homebrew 安装完成"
        else
            print_success "Homebrew 已安装"
        fi
        
        # 安装 Git
        if ! command -v git &> /dev/null; then
            print_info "安装 Git..."
            brew install git
        else
            print_success "Git 已安装"
        fi
        
        # 安装 GPG
        if ! command -v gpg &> /dev/null; then
            print_info "安装 GPG..."
            brew install gnupg
        else
            print_success "GPG 已安装"
        fi
    fi
    
    # Linux 系统工具安装
    if [[ "$OS" == "linux" ]]; then
        if ! command -v git &> /dev/null; then
            print_info "安装 Git..."
            sudo apt-get update && sudo apt-get install -y git
        else
            print_success "Git 已安装"
        fi
        
        if ! command -v gpg &> /dev/null; then
            print_info "安装 GPG..."
            sudo apt-get install -y gnupg
        else
            print_success "GPG 已安装"
        fi
    fi
}

# 收集用户信息
collect_user_info() {
    print_info "收集配置信息..."
    echo
    
    # 用户邮箱
    while true; do
        read -p "请输入您的GitHub邮箱地址: " USER_EMAIL
        if [[ "$USER_EMAIL" =~ ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$ ]]; then
            break
        else
            print_error "邮箱格式不正确，请重新输入"
        fi
    done
    
    # 用户姓名
    read -p "请输入您的真实姓名: " USER_NAME
    if [[ -z "$USER_NAME" ]]; then
        USER_NAME="Rroqheo"
    fi
    
    # 是否配置多账号
    echo
    print_info "是否需要配置多账号支持？(个人+工作)"
    read -p "输入 y/n (默认: n): " MULTI_ACCOUNT
    MULTI_ACCOUNT=${MULTI_ACCOUNT:-n}
    
    if [[ "$MULTI_ACCOUNT" == "y" || "$MULTI_ACCOUNT" == "Y" ]]; then
        read -p "请输入工作邮箱地址: " WORK_EMAIL
        read -p "请输入工作用户名: " WORK_USERNAME
    fi
    
    echo
    print_success "信息收集完成"
}

# 配置 Git
configure_git() {
    print_info "配置 Git..."
    
    # 基础配置
    git config --global user.name "$USER_NAME"
    git config --global user.email "$USER_EMAIL"
    
    # 中文支持
    git config --global core.quotepath false
    git config --global gui.encoding utf-8
    git config --global i18n.commit.encoding utf-8
    git config --global i18n.logoutputencoding utf-8
    
    # 高级配置
    git config --global init.defaultBranch main
    git config --global push.default simple
    git config --global pull.rebase true
    
    # 实用别名
    git config --global alias.st status
    git config --global alias.co checkout
    git config --global alias.br branch
    git config --global alias.ci commit
    git config --global alias.lg "log --oneline --decorate --graph --all"
    git config --global alias.glog "log --graph --pretty=format:'%Cred%h%Creset -%C(yellow)%d%Creset %s %Cgreen(%cr) %C(bold blue)<%an>%Creset'"
    git config --global alias.unstage "reset HEAD --"
    git config --global alias.last "log -1 HEAD"
    git config --global alias.visual "!gitk"
    
    # 性能优化
    git config --global core.preloadindex true
    git config --global core.fscache true
    git config --global feature.manyFiles true
    
    print_success "Git 配置完成"
}

# 配置 SSH
configure_ssh() {
    print_info "配置 SSH 密钥..."
    
    SSH_DIR="$HOME/.ssh"
    mkdir -p "$SSH_DIR"
    chmod 700 "$SSH_DIR"
    
    # 生成个人账号 SSH 密钥
    if [[ ! -f "$SSH_DIR/id_ed25519" ]]; then
        print_info "生成个人账号 SSH 密钥..."
        ssh-keygen -t ed25519 -C "$USER_EMAIL" -f "$SSH_DIR/id_ed25519" -N ""
        print_success "个人账号 SSH 密钥生成完成"
    else
        print_success "个人账号 SSH 密钥已存在"
    fi
    
    # 多账号配置
    if [[ "$MULTI_ACCOUNT" == "y" || "$MULTI_ACCOUNT" == "Y" ]]; then
        if [[ ! -f "$SSH_DIR/id_ed25519_work" ]]; then
            print_info "生成工作账号 SSH 密钥..."
            ssh-keygen -t ed25519 -C "$WORK_EMAIL" -f "$SSH_DIR/id_ed25519_work" -N ""
            print_success "工作账号 SSH 密钥生成完成"
        else
            print_success "工作账号 SSH 密钥已存在"
        fi
        
        # 创建 SSH 配置文件
        cat > "$SSH_DIR/config" << EOF
# GitHub个人账号
Host github.com
    HostName github.com
    User git
    IdentityFile ~/.ssh/id_ed25519
    UseKeychain yes
    AddKeysToAgent yes

# GitHub工作账号
Host github-work
    HostName github.com
    User git
    IdentityFile ~/.ssh/id_ed25519_work
    UseKeychain yes
    AddKeysToAgent yes

# 通用优化配置
Host *
    ServerAliveInterval 60
    ServerAliveCountMax 3
    TCPKeepAlive yes
    Compression yes
EOF
    else
        # 单账号配置
        cat > "$SSH_DIR/config" << EOF
# GitHub配置
Host github.com
    HostName github.com
    User git
    IdentityFile ~/.ssh/id_ed25519
    UseKeychain yes
    AddKeysToAgent yes

# 通用优化配置
Host *
    ServerAliveInterval 60
    ServerAliveCountMax 3
    TCPKeepAlive yes
    Compression yes
EOF
    fi
    
    chmod 600 "$SSH_DIR/config"
    print_success "SSH 配置完成"
}

# 配置 GPG
configure_gpg() {
    print_info "配置 GPG 签名..."
    
    # 创建 GPG 配置目录
    GPG_DIR="$HOME/.gnupg"
    mkdir -p "$GPG_DIR"
    chmod 700 "$GPG_DIR"
    
    # 检查是否已有 GPG 密钥
    if gpg --list-secret-keys --keyid-format LONG | grep -q "sec"; then
        print_success "GPG 密钥已存在"
        GPG_KEY_ID=$(gpg --list-secret-keys --keyid-format LONG | grep "sec" | head -1 | sed 's/.*\/\([A-F0-9]*\).*/\1/')
    else
        print_info "生成 GPG 密钥..."
        
        # 创建 GPG 密钥生成配置
        cat > /tmp/gpg_gen_key << EOF
%echo 正在生成 GPG 密钥
Key-Type: RSA
Key-Length: 4096
Subkey-Type: RSA
Subkey-Length: 4096
Name-Real: $USER_NAME
Name-Email: $USER_EMAIL
Expire-Date: 0
%no-protection
%commit
%echo GPG 密钥生成完成
EOF
        
        # 生成密钥
        gpg --batch --generate-key /tmp/gpg_gen_key
        rm /tmp/gpg_gen_key
        
        # 获取密钥 ID
        GPG_KEY_ID=$(gpg --list-secret-keys --keyid-format LONG | grep "sec" | head -1 | sed 's/.*\/\([A-F0-9]*\).*/\1/')
        print_success "GPG 密钥生成完成"
    fi
    
    # 配置 Git 使用 GPG 签名
    git config --global user.signingkey "$GPG_KEY_ID"
    git config --global commit.gpgsign true
    git config --global tag.gpgsign true
    
    print_success "GPG 配置完成"
}

# 创建个人资料
create_profile() {
    print_info "创建专业个人资料..."
    
    PROFILE_DIR="$HOME/github-profile"
    mkdir -p "$PROFILE_DIR"
    cd "$PROFILE_DIR"
    
    # 初始化仓库
    if [[ ! -d ".git" ]]; then
        git init
        git branch -M main
    fi
    
    # 创建 README.md
    cat > README.md << EOF
<div align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&height=200&section=header&text=$USER_NAME&fontSize=80&fontAlignY=35&animation=twinkling&fontColor=gradient" />
</div>

<div align="center">
  <img src="https://readme-typing-svg.herokuapp.com?font=Fira+Code&pause=1000&color=2196F3&center=true&vCenter=true&width=435&lines=热爱编程的开发者;持续学习，持续成长;欢迎来到我的GitHub!" alt="Typing SVG" />
</div>

## 🚀 关于我

- 🔭 目前正在开发有趣的项目
- 🌱 正在学习新技术和最佳实践
- 💬 可以和我聊聊技术、编程、开源
- 📫 联系我：**$USER_EMAIL**
- ⚡ 有趣的事实：我喜欢用代码解决问题

## 🛠️ 技术栈

![Git](https://img.shields.io/badge/-Git-F05032?style=for-the-badge&logo=Git&logoColor=white)
![GitHub](https://img.shields.io/badge/-GitHub-181717?style=for-the-badge&logo=GitHub&logoColor=white)
![VS Code](https://img.shields.io/badge/-VS%20Code-007ACC?style=for-the-badge&logo=Visual%20Studio%20Code&logoColor=white)

## 📊 GitHub 统计

<div align="center">
  <img height="180em" src="https://github-readme-stats.vercel.app/api?username=$USER_NAME&show_icons=true&theme=tokyonight&include_all_commits=true&count_private=true&hide_border=true"/>
  <img height="180em" src="https://github-readme-stats.vercel.app/api/top-langs/?username=$USER_NAME&layout=compact&langs_count=8&theme=tokyonight&hide_border=true"/>
</div>

<div align="center">
  <img src="https://github-readme-streak-stats.herokuapp.com/?user=$USER_NAME&theme=tokyonight&hide_border=true" />
</div>

## 🏆 GitHub 奖杯

<div align="center">
  <img src="https://github-profile-trophy.vercel.app/?username=$USER_NAME&theme=tokyonight&no-frame=true&column=7" />
</div>

---

<div align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&height=100&section=footer" />
</div>

**感谢访问我的GitHub！记得给有趣的项目点个⭐**
EOF
    
    # 提交文件
    git add README.md
    git commit -m "feat: 创建专业个人资料README" || true
    
    print_success "个人资料创建完成"
    cd - > /dev/null
}

# 显示配置结果
show_results() {
    clear
    print_header
    
    echo -e "${GREEN}🎉 GitHub终极配置完成！${NC}"
    echo
    
    print_info "✨ 已完成的配置："
    echo "  🔧 Git 基础配置和实用别名"
    echo "  🔐 SSH 密钥配置"
    echo "  🔏 GPG 签名配置"
    echo "  🎨 专业个人资料模板"
    echo
    
    print_info "📋 下一步操作："
    echo "1. 将 SSH 公钥添加到 GitHub："
    echo "   https://github.com/settings/ssh"
    echo
    echo "2. 将 GPG 公钥添加到 GitHub："
    echo "   https://github.com/settings/gpg"
    echo
    
    print_info "🔑 您的 SSH 公钥："
    echo "=================================================="
    if [[ -f "$HOME/.ssh/id_ed25519.pub" ]]; then
        cat "$HOME/.ssh/id_ed25519.pub"
    fi
    echo "=================================================="
    echo
    
    if [[ "$MULTI_ACCOUNT" == "y" || "$MULTI_ACCOUNT" == "Y" ]]; then
        print_info "🔑 您的工作账号 SSH 公钥："
        echo "=================================================="
        if [[ -f "$HOME/.ssh/id_ed25519_work.pub" ]]; then
            cat "$HOME/.ssh/id_ed25519_work.pub"
        fi
        echo "=================================================="
        echo
    fi
    
    print_info "🔐 您的 GPG 公钥："
    echo "=================================================="
    if [[ -n "$GPG_KEY_ID" ]]; then
        gpg --armor --export "$GPG_KEY_ID"
    fi
    echo "=================================================="
    echo
    
    print_info "🧪 验证命令："
    echo "git config --global --list | grep user"
    echo "ssh -T git@github.com"
    echo "gpg --list-secret-keys"
    echo
    
    print_success "🌟 恭喜！您的GitHub账号已经满血配置完成！"
    echo
}

# 主函数
main() {
    print_header
    
    print_info "开始 GitHub 终极配置..."
    echo
    
    # 执行配置步骤
    check_system
    install_tools
    collect_user_info
    configure_git
    configure_ssh
    configure_gpg
    create_profile
    show_results
    
    # 等待用户确认
    echo
    read -p "按回车键退出..." dummy
}

# 运行主函数
main "$@"


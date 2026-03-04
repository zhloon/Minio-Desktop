<!-- eslint-disable vue/no-v-html -->
<template>
  <div class="app-wrapper">
    <h2>MINIO 桌面文件管理系统</h2>

    <div v-if="currentPanel === 'login'" class="login-container">
      <div class="login-card">
        <div class="login-header">
          <div class="logo-circle" v-html="SVGS.bucket"></div>
          <h2>MINIO 桌面控制台</h2>
          <p>欢迎回来，请连接您的私有云存储</p>
        </div>

        <div class="login-form">
          <div class="input-group">
            <span class="input-icon">
              <svg
                viewBox="0 0 24 24"
                width="18"
                height="18"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="2" y1="12" x2="22" y2="12"></line>
                <path
                  d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"
                ></path>
              </svg>
            </span>
            <input
              v-model="config.endpoint"
              type="text"
              placeholder="API Endpoint (如: https://minio.easylabel.cloud)"
            />
          </div>

          <div class="input-group">
            <span class="input-icon">
              <svg
                viewBox="0 0 24 24"
                width="18"
                height="18"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </span>
            <input v-model="config.ak" type="text" placeholder="Access Key" />
          </div>

          <div class="input-group">
            <span class="input-icon">
              <svg
                viewBox="0 0 24 24"
                width="18"
                height="18"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
            </span>
            <input
              v-model="config.sk"
              type="password"
              placeholder="Secret Key"
              @keydown.enter="connectMinio"
            />
          </div>

          <button class="btn-login" :disabled="isConnecting" @click="connectMinio">
            {{ isConnecting ? '正在建立安全连接...' : '连 接 系 统' }}
          </button>
        </div>

        <div v-if="loginError" class="login-error">
          <svg
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          {{ loginError }}
        </div>
      </div>
    </div>

    <div v-else-if="currentPanel === 'bucket'" class="panel">
      <div class="control-panel">
        <div class="panel-group">
          <input
            v-model="newBucketName"
            type="text"
            placeholder="输入新 Bucket 名称"
            style="width: 200px"
          />
          <button class="btn-primary btn-add" @click="createBucket">
            <svg
              viewBox="0 0 24 24"
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            新增 Bucket
          </button>
        </div>
        <span class="text-link" @click="logout">
          <span class="icon-wrap" v-html="SVGS.folderSmall"></span> 退出连接
        </span>
      </div>

      <div class="gallery">
        <div
          v-for="b in buckets"
          :key="b.Name"
          class="card folder-card"
          @click="enterBucket(b.Name)"
        >
          <div class="folder-icon" v-html="SVGS.bucket"></div>
          <h3>{{ b.Name }}</h3>
          <div class="card-actions" style="grid-template-columns: 1fr 1fr">
            <button
              :style="{ backgroundColor: b.isPublic ? '#fd7e14' : '#28a745', color: 'white' }"
              @click.stop="toggleBucketPolicy(b)"
            >
              {{ b.isPublic ? '🔓 公开' : '🔒 私密' }}
            </button>
            <button class="btn-delete" @click.stop="deleteBucket(b.Name)">
              <span class="icon-wrap" v-html="SVGS.btnDelete"></span> 删除
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="currentPanel === 'main'" class="panel">
      <div class="control-panel">
        <div class="panel-group">
          <button class="btn-secondary" @click="goUpOneLevel">
            <span class="icon-wrap" v-html="SVGS.btnMove"></span> 返回上级
          </button>
          <div class="divider"></div>

          <button style="background-color: #17a2b8" @click="openCreatePathModal">
            ➕ 新建路径
          </button>

          <input
            ref="fileInputRef"
            type="file"
            multiple
            style="display: none"
            @change="uploadFiles"
          />
          <button style="background-color: #007bff" @click="fileInputRef.click()">
            ☁️ 上传文件
          </button>
        </div>

        <div class="panel-group">
          <input
            v-model="searchKeyword"
            type="text"
            placeholder="搜索目录层级..."
            style="width: 140px"
            @keydown.enter="performSearch"
          />
          <button class="btn-search" @click="performSearch">🔍 搜索</button>
          <div class="divider"></div>
          <button class="btn-secondary" @click="selectAllVisible">☑️ 全选</button>
          <button class="btn-batch" @click="batchDownload">📦 打包</button>
          <button class="btn-delete" @click="batchDelete">🗑️ 删除</button>
          <button class="btn-secondary" @click="clearSearchAndRefresh">🔄 刷新</button>
        </div>
      </div>

      <div class="breadcrumb">
        <span @click="navigateTo('')">
          <span class="icon-wrap" v-html="SVGS.bucketSmall"></span> {{ currentBucket }}
        </span>
        <template v-for="(part, index) in breadcrumbs" :key="index">
          <span class="separator">/</span>
          <span v-if="index === breadcrumbs.length - 1" class="current">{{ part.name }}</span>
          <span v-else class="clickable" @click="navigateTo(part.path)">{{ part.name }}</span>
        </template>
        <span v-if="isSearchMode" class="separator">|</span>
        <span v-if="isSearchMode" class="current" style="color: #dc3545"
          >搜索: {{ searchKeyword }}</span
        >
      </div>

      <div class="gallery">
        <div
          v-if="objects.length === 0"
          style="grid-column: 1 / -1; text-align: center; color: #666"
        >
          内容为空
        </div>

        <div
          v-for="item in objects"
          :key="item.Key"
          class="card"
          :class="{ 'folder-card': item.isFolder }"
          @click="item.isFolder ? enterFolder(item.Key) : null"
        >
          <input
            v-model="selectedFiles"
            type="checkbox"
            class="file-checkbox"
            :value="item.Key"
            @click.stop
          />

          <div v-if="item.isFolder" class="folder-icon" v-html="SVGS.folder"></div>

          <div v-else class="file-preview" @click.stop="previewFile(item)">
            <template v-if="item.isImage">
              <img v-if="item.url" :src="item.url" :alt="item.name" />
              <span v-else class="loading-text">加载图片中...</span>
            </template>

            <template v-else-if="item.isPdf">
              <span v-if="!item.url" class="loading-text">加载文件流...</span>
              <template v-else>
                <span class="loading-text">渲染中...</span>
                <canvas class="pdf-thumb-canvas" :data-url="item.url"></canvas>
              </template>
            </template>

            <template v-else>
              <div class="doc-icon" v-html="getFileIcon(item.name)"></div>
              <span style="font-size: 12px; color: #666; position: absolute; bottom: 15px">{{
                getFileTypeName(item.name)
              }}</span>
            </template>
          </div>

          <p :title="item.displayPath || item.name">
            <strong>{{ item.displayPath || item.name }}</strong>
          </p>

          <div class="card-actions">
            <button
              class="btn-download"
              @click.stop="
                item.isFolder ? downloadFolder(item.Key) : downloadObject(item.Key, item.name)
              "
            >
              <span class="icon-wrap" v-html="SVGS.btnDownload"></span> 下载
            </button>
            <button class="btn-move" @click.stop="openPathSelectModal(item.Key, item.isFolder)">
              <span class="icon-wrap" v-html="SVGS.btnMove"></span> 移动
            </button>
            <button
              class="btn-secondary"
              @click.stop="item.isFolder ? renameFolder(item.Key) : renameFile(item.Key, item.name)"
            >
              <span class="icon-wrap" v-html="SVGS.btnEdit"></span> 改名
            </button>
            <button
              class="btn-delete"
              @click.stop="item.isFolder ? deleteFolderRecursive(item.Key) : deleteObject(item.Key)"
            >
              <span class="icon-wrap" v-html="SVGS.btnDelete"></span> 删除
            </button>
          </div>
        </div>
      </div>
    </div>

    <span v-if="statusMessage" class="global-status" :class="{ 'is-error': isStatusError }">{{
      statusMessage
    }}</span>

    <div v-if="modals.image.show" class="image-modal" @click="modals.image.show = false">
      <div class="image-modal-controls" @click.stop>
        <button class="image-modal-btn" title="打印图片" @click="printPreview(false)">🖨️</button>
        <button class="image-modal-btn" title="关闭" @click="modals.image.show = false">✖</button>
      </div>
      <div class="image-modal-content" @click.stop>
        <img :src="modals.image.url" />
        <div class="image-modal-title">{{ modals.image.title }}</div>
      </div>
    </div>

    <div v-show="modals.pdf.show" class="pdf-modal">
      <div class="pdf-modal-container">
        <div class="pdf-modal-header">
          <h3>{{ modals.pdf.title }}</h3>
          <div style="display: flex; gap: 10px">
            <button
              class="btn-secondary"
              style="background-color: #17a2b8"
              @click="printPreview(true)"
            >
              🖨️ 打印
            </button>
            <button class="btn-close-pdf" @click="closePdfViewer">✖ 关闭</button>
          </div>
        </div>
        <div ref="pdfBodyRef" class="pdf-modal-body">
          <canvas ref="pdfCanvasRef"></canvas>
        </div>
        <div class="pdf-modal-footer">
          <button :disabled="modals.pdf.page <= 1" @click="changePdfPage(-1)">◀ 上一页</button>
          <span>第 {{ modals.pdf.page }} / 共 {{ modals.pdf.total }} 页</span>
          <button :disabled="modals.pdf.page >= modals.pdf.total" @click="changePdfPage(1)">
            下一页 ▶
          </button>
        </div>
      </div>
    </div>

    <div v-if="modals.progress.show" class="progress-modal">
      <div class="progress-container">
        <div class="progress-title">⏳ {{ modals.progress.title }}</div>
        <div class="progress-bar-bg">
          <div class="progress-bar-fill" :style="{ width: modals.progress.percent + '%' }"></div>
        </div>
        <div class="progress-text">{{ modals.progress.text }}</div>
      </div>
    </div>

    <div v-if="modals.input.show" class="input-modal">
      <div class="input-modal-container">
        <div class="input-modal-header">
          <h3>{{ modals.input.title }}</h3>
        </div>
        <div class="input-modal-body">
          <p v-if="modals.input.isConfirm" v-html="modals.input.msg"></p>
          <input
            v-else
            v-model="modals.input.val"
            type="text"
            class="input-modal-input"
            :placeholder="modals.input.placeholder"
            @keydown.enter="confirmInput"
          />
        </div>
        <div class="input-modal-footer">
          <button class="btn-secondary" @click="modals.input.show = false">取消</button>
          <button
            :class="modals.input.isConfirm ? 'btn-delete' : 'btn-search'"
            @click="confirmInput"
          >
            确定
          </button>
        </div>
      </div>
    </div>

    <div v-if="modals.path.show" class="input-modal">
      <div class="input-modal-container" style="width: 500px">
        <div class="input-modal-header"><h3>选择目标位置</h3></div>
        <div class="input-modal-body" style="padding: 15px 20px">
          <p style="margin: 0 0 5px 0; font-size: 13px; color: #666">
            展开目录，点击选中要移动到的路径：
          </p>
          <div class="tree-container">
            <div v-if="modals.path.loading" style="text-align: center; color: #666">
              正在扫描目录树...
            </div>
            <div v-else>
              <div
                v-for="node in flattenedTree"
                :key="node.path"
                class="tree-item"
                :style="{ marginLeft: node.depth * 20 + 'px' }"
                :class="{ selected: modals.path.selected === node.path }"
                @click="modals.path.selected = node.path"
              >
                <span
                  class="tree-toggle"
                  :class="{ empty: !node.hasChildren }"
                  @click.stop="toggleTreeNode(node)"
                >
                  <span
                    v-if="node.hasChildren"
                    class="icon-wrap"
                    v-html="node.expanded ? SVGS.chevronDown : SVGS.chevronRight"
                  ></span>
                </span>
                // eslint-disable-next-line vue/no-v-html
                <span class="icon-wrap" v-html="SVGS.folderSmall"></span>
                <span class="tree-name">{{ node.name }}</span>
              </div>
            </div>
          </div>
        </div>
        <div class="input-modal-footer">
          <button class="btn-secondary" @click="modals.path.show = false">取消</button>
          <button class="btn-move" :disabled="modals.path.selected === null" @click="confirmMove">
            移动到此处
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick, shallowRef, markRaw } from 'vue'

const getWindow = () => window
const safeArg = (str) => (str ? str.replace(/\\/g, '/').replace(/^\/+/, '') : '')

// SVG 图标配置 (保持不变)
const SVGS = {
  bucket: `<svg viewBox="0 0 24 24" width="50" height="50" fill="none" stroke="#007bff" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"></path></svg>`,
  folder: `<svg viewBox="0 0 24 24" width="60" height="60" fill="#ffc107"><path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"></path></svg>`,
  file: `<svg viewBox="0 0 24 24" width="50" height="50" fill="COLOR"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"></path></svg>`,
  zip: `<svg viewBox="0 0 24 24" width="50" height="50" fill="#6c757d"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm-2 2h2v2h-2V4zm-2 2h2v2h-2V6zm2 2h2v2h-2V8zm-2 2h2v2h-2v-2zm2 2h2v2h-2v-2zm-2 2h2v4h-2v-4zm4 4h-2v-2h2v2zm2-6h-2v-2h2v2zm0-4V3.5L18.5 9H13z"></path></svg>`,
  btnDownload: `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>`,
  btnMove: `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>`,
  btnEdit: `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>`,
  btnDelete: `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>`,
  bucketSmall: `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"></path></svg>`,
  folderSmall: `<svg fill="#ffc107" viewBox="0 0 24 24" width="18" height="18"><path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"></path></svg>`,
  chevronRight: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>`,
  chevronDown: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>`
}

const s3Client = shallowRef(null)
let currentPdfDoc = null
let currentPreviewUrl = null

const currentPanel = ref('login')
const isConnecting = ref(false)
const loginError = ref('')
const statusMessage = ref('')
const isStatusError = ref(false)
const isSearchMode = ref(false)
const searchKeyword = ref('')

const config = reactive({ endpoint: 'http://127.0.0.1:9000', ak: 'minioadmin', sk: 'minioadmin' })
const buckets = ref([])
const newBucketName = ref('')
const currentBucket = ref('')
const currentPrefix = ref('')
const objects = ref([])
const selectedFiles = ref([])
const fileInputRef = ref(null)

const pdfCanvasRef = ref(null)
const pdfBodyRef = ref(null)

const modals = reactive({
  input: {
    show: false,
    title: '',
    placeholder: '',
    val: '',
    msg: '',
    isConfirm: false,
    callback: null
  },
  progress: { show: false, title: '', percent: 0, text: '' },
  image: { show: false, url: '', title: '' },
  pdf: { show: false, title: '', page: 1, total: 1 },
  path: {
    show: false,
    loading: true,
    sourceKey: '',
    isFolder: false,
    selected: null,
    rawTree: null
  }
})

onMounted(() => {
  if (localStorage.getItem('minio_endpoint')) {
    config.endpoint = localStorage.getItem('minio_endpoint')
    config.ak = localStorage.getItem('minio_ak') || ''
    config.sk = localStorage.getItem('minio_sk') || ''
  }
})

const showMsg = (msg, error = false) => {
  statusMessage.value = msg
  isStatusError.value = error
  if (!msg.includes('正在'))
    setTimeout(() => {
      statusMessage.value = ''
    }, 3000)
}
const showProgress = (title) => {
  modals.progress = { show: true, title, percent: 0, text: '准备中...' }
}
const updateProgress = (percent, text) => {
  modals.progress.percent = percent
  modals.progress.text = text
}

// 内部工具：生成无签名的安全直链
const getPublicUrl = (key) => {
  return `${config.endpoint}/${currentBucket.value}/${encodeURIComponent(key).replace(/%2F/g, '/')}`
}

const connectMinio = async () => {
  isConnecting.value = true
  loginError.value = ''

  let rawEndpoint = config.endpoint.trim()
  if (!rawEndpoint.startsWith('http://') && !rawEndpoint.startsWith('https://')) {
    rawEndpoint = 'http://' + rawEndpoint
  }
  try {
    const urlObj = new URL(rawEndpoint)
    config.endpoint = urlObj.origin
  } catch (e) {
    loginError.value = 'API Endpoint 格式错误'
    isConnecting.value = false
    console.log(e)
    return
  }

  const AWS = getWindow().AWS
  AWS.config.update({
    accessKeyId: config.ak,
    secretAccessKey: config.sk,
    endpoint: config.endpoint,
    s3ForcePathStyle: true,
    signatureVersion: 'v4',
    region: 'us-east-1'
  })
  s3Client.value = markRaw(new AWS.S3())

  try {
    await loadBuckets()
    localStorage.setItem('minio_endpoint', config.endpoint)
    localStorage.setItem('minio_ak', config.ak)
    localStorage.setItem('minio_sk', config.sk)
  } catch (err) {
    console.error(err)
    loginError.value = '连接失败！请检查配置。'
  } finally {
    isConnecting.value = false
  }
}

const logout = () => {
  s3Client.value = null
  currentPanel.value = 'login'
}

const loadBuckets = async () => {
  currentPanel.value = 'bucket'
  try {
    const data = await s3Client.value.listBuckets().promise()

    // 【核心修改】：并发探测所有存储桶的当前公开/私密状态
    const bucketPromises = data.Buckets.map(async (b) => {
      let isPublic = false
      try {
        // 尝试获取存储桶策略
        const policyData = await s3Client.value.getBucketPolicy({ Bucket: b.Name }).promise()
        // 如果策略存在，且包含了允许所有人访问的 "*"，则判定为公开
        if (policyData.Policy && policyData.Policy.includes('*')) {
          isPublic = true
        }
      } catch (e) {
        // 如果报错 NoSuchBucketPolicy，说明没有策略，默认是私密的
        console.log(e)
        isPublic = false
      }
      // 将 isPublic 状态混入存储桶对象中返回
      return { ...b, isPublic }
    })

    // 等待所有状态探测完毕，再渲染列表
    buckets.value = (await Promise.all(bucketPromises)).sort(
      (a, b) => b.CreationDate - a.CreationDate
    )
  } catch (err) {
    console.error(err)
    showMsg('加载Bucket失败', true)
  }
}

const createBucket = async () => {
  const name = newBucketName.value.trim().toLowerCase()
  if (!name) return
  try {
    await s3Client.value.createBucket({ Bucket: name }).promise()
    newBucketName.value = ''
    loadBuckets()
  } catch (err) {
    console.error(err)
    showMsg('创建失败: ' + err.message, true)
  }
}

const deleteBucket = (name) => {
  modals.input = {
    show: true,
    isConfirm: true,
    title: '删除存储桶',
    msg: `确定要删除空桶 <b>${name}</b> 吗？`,
    callback: async () => {
      try {
        await s3Client.value.deleteBucket({ Bucket: name }).promise()
        loadBuckets()
      } catch (err) {
        console.error(err)
        showMsg('删除失败: 桶内还有隐藏文件。', true)
      }
    }
  }
}
// 🌟【智能切换功能】：根据当前状态，自动设置公开或私密
const toggleBucketPolicy = async (bucket) => {
  const bucketName = bucket.Name
  const makePublic = !bucket.isPublic // 反转当前状态

  showMsg(`正在配置 ${bucketName} 的网络权限...`, false)
  try {
    if (makePublic) {
      // 设为公开：注入只读直链策略
      const policy = {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: '*',
            Action: ['s3:GetObject'],
            Resource: [`arn:aws:s3:::${bucketName}/*`]
          }
        ]
      }
      await s3Client.value
        .putBucketPolicy({
          Bucket: bucketName,
          Policy: JSON.stringify(policy)
        })
        .promise()

      bucket.isPublic = true // 动态更新界面状态
      showMsg(`✅ 成功！${bucketName} 现已支持外网直链访问！`)
    } else {
      // 设为私密：直接删除该存储桶的所有策略
      await s3Client.value.deleteBucketPolicy({ Bucket: bucketName }).promise()

      bucket.isPublic = false // 动态更新界面状态
      showMsg(`🔒 成功！${bucketName} 已恢复为私密状态！`)
    }
  } catch (err) {
    console.error('设置权限失败', err)
    showMsg('权限设置失败: ' + err.message, true)
  }
}
const enterBucket = (name) => {
  currentBucket.value = name
  currentPrefix.value = ''
  selectedFiles.value = []
  isSearchMode.value = false
  searchKeyword.value = ''
  currentPanel.value = 'main'
  loadObjects()
}

const breadcrumbs = computed(() => {
  if (!currentPrefix.value) return []
  const parts = currentPrefix.value.split('/').filter(Boolean)
  let path = ''
  return parts.map((p) => {
    path += p + '/'
    return { name: p, path }
  })
})

const navigateTo = (prefix) => {
  currentPrefix.value = prefix
  isSearchMode.value = false
  searchKeyword.value = ''
  loadObjects()
}
const enterFolder = (prefix) => {
  navigateTo(prefix)
}
const goUpOneLevel = () => {
  if (currentPrefix.value === '') return loadBuckets()
  let parts = currentPrefix.value.split('/').filter(Boolean)
  parts.pop()
  currentPrefix.value = parts.length ? parts.join('/') + '/' : ''
  loadObjects()
}

const loadObjects = async () => {
  isSearchMode.value = false
  selectedFiles.value = []

  // 🌟 1. 生成当前路径的专属缓存 Key
  const cacheKey = `minio_dir_${currentBucket.value}_${currentPrefix.value}`

  // 🌟 2. 尝试读取本地缓存并瞬间渲染界面
  const cachedData = localStorage.getItem(cacheKey)
  if (cachedData) {
    objects.value = JSON.parse(cachedData)
  } else {
    showMsg('正在拉取云端数据...', false) // 只有没缓存时才提示加载
  }

  // 🌟 3. 后台静默拉取最新数据
  try {
    const data = await s3Client.value
      .listObjectsV2({ Bucket: currentBucket.value, Prefix: currentPrefix.value, Delimiter: '/' })
      .promise()
    let items = []

    if (data.CommonPrefixes) {
      data.CommonPrefixes.forEach((p) =>
        items.push({
          Key: p.Prefix,
          name: p.Prefix.replace(currentPrefix.value, '').replace('/', ''),
          isFolder: true
        })
      )
    }
    if (data.Contents) {
      data.Contents.sort((a, b) => b.LastModified - a.LastModified).forEach((i) => {
        if (i.Key === currentPrefix.value) return
        const name = i.Key.replace(currentPrefix.value, '')
        const ext = name.split('.').pop().toLowerCase()
        const item = {
          Key: i.Key,
          name,
          isFolder: false,
          ext,
          isImage: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(ext),
          isPdf: ext === 'pdf',
          url: ''
        }
        if (item.isImage || item.isPdf) {
          // 先用原始直链占位
          item.url = getPublicUrl(i.Key)
          // 后台去硬盘里找，找到了就无缝替换为本地急速版
          getCachedMediaUrl(item.url).then((localUrl) => {
            item.url = localUrl
          })
          if (item.isPdf) nextTick(renderPdfThumbnails)
        }
        items.push(item)
      })
    }

    // 🌟 4. 更新界面，并把最新数据写入本地缓存
    objects.value = items
    localStorage.setItem(cacheKey, JSON.stringify(items))

    if (!cachedData) showMsg('加载完成')
  } catch (err) {
    console.error(err)
    if (!cachedData) showMsg('读取失败: ' + err.message, true)
  }
}

const performSearch = async () => {
  const kw = searchKeyword.value.trim().toLowerCase()
  if (!kw) return loadObjects()
  isSearchMode.value = true
  selectedFiles.value = []
  objects.value = []
  showMsg('正在深度检索...', false)
  try {
    let all = []
    let trunc = true
    let tok = undefined
    while (trunc) {
      const data = await s3Client.value
        .listObjectsV2({
          Bucket: currentBucket.value,
          Prefix: currentPrefix.value,
          ContinuationToken: tok
        })
        .promise()
      if (data.Contents) all = all.concat(data.Contents)
      trunc = data.IsTruncated
      tok = data.NextContinuationToken
    }
    let folders = new Set()
    all.forEach((i) => {
      let p = i.Key.split('/')
      if (!i.Key.endsWith('/')) p.pop()
      else p.pop()
      let b = ''
      for (let x of p) {
        b += x + '/'
        if (b.startsWith(currentPrefix.value) && b !== currentPrefix.value) folders.add(b)
      }
    })
    let items = []
    Array.from(folders)
      .filter((f) => f.toLowerCase().includes(kw))
      .forEach((f) =>
        items.push({
          Key: f,
          name: f.replace(currentPrefix.value, ''),
          isFolder: true,
          displayPath: f.startsWith(currentPrefix.value)
            ? f.substring(currentPrefix.value.length)
            : f
        })
      )
    objects.value = items
    if (items.length === 0) showMsg('未找到匹配目录', true)
    else showMsg('检索完成')
  } catch (err) {
    console.error(err)
    showMsg('检索失败: ' + err.message, true)
  }
}

const clearSearchAndRefresh = () => {
  searchKeyword.value = ''
  loadObjects()
}
const selectAllVisible = () => {
  if (selectedFiles.value.length === objects.value.length) selectedFiles.value = []
  else selectedFiles.value = objects.value.map((o) => o.Key)
}

const getFileTypeName = (name) => {
  const ext = name.split('.').pop().toLowerCase()
  if (['doc', 'docx'].includes(ext)) return 'Word 文档'
  if (['xls', 'xlsx'].includes(ext)) return 'Excel 表格'
  if (['ppt', 'pptx'].includes(ext)) return 'PPT 演示'
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return '压缩包'
  if (ext === 'txt') return '文本文件'
  return '未知文件'
}

const getFileIcon = (name) => {
  const ext = name.split('.').pop().toLowerCase()
  if (['doc', 'docx'].includes(ext)) return SVGS.file.replace('COLOR', '#2b579a')
  if (['xls', 'xlsx'].includes(ext)) return SVGS.file.replace('COLOR', '#217346')
  if (['ppt', 'pptx'].includes(ext)) return SVGS.file.replace('COLOR', '#b7472a')
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return SVGS.zip
  return SVGS.file.replace('COLOR', '#9aa0a6')
}

const renderPdfThumbnails = async () => {
  const pdfjsLib = getWindow()['pdfjs-dist/build/pdf'] || getWindow().pdfjsLib
  if (!pdfjsLib) return
  const canvases = document.querySelectorAll('.pdf-thumb-canvas:not([data-rendered="true"])')
  for (let canvas of canvases) {
    canvas.setAttribute('data-rendered', 'true')
    try {
      const pdf = await pdfjsLib.getDocument(canvas.dataset.url).promise
      const page = await pdf.getPage(1)
      const viewport = page.getViewport({ scale: 2.0 })
      canvas.width = viewport.width
      canvas.height = viewport.height
      await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise
      if (canvas.previousElementSibling) canvas.previousElementSibling.style.display = 'none'
    } catch (err) {
      console.warn('PDF缩略图渲染失败', err)
    }
  }
}

const previewFile = (item) => {
  if (item.isImage) {
    currentPreviewUrl = item.url
    modals.image = { show: true, url: item.url, title: item.name }
  } else if (item.isPdf) {
    currentPreviewUrl = item.url
    modals.pdf.title = item.name
    modals.pdf.show = true
    modals.pdf.page = 1
    const pdfjsLib = getWindow()['pdfjs-dist/build/pdf'] || getWindow().pdfjsLib
    pdfjsLib
      .getDocument(item.url)
      .promise.then((pdf) => {
        currentPdfDoc = markRaw(pdf)
        modals.pdf.total = pdf.numPages
        renderPdfPage(1)
      })
      .catch((err) => {
        console.error(err)
        alert('打开 PDF 失败: 可能文件已损坏')
        closePdfViewer()
      })
  } else {
    downloadObject(item.Key, item.name)
  }
}

const renderPdfPage = async (num) => {
  modals.pdf.page = num
  const ctx = pdfCanvasRef.value.getContext('2d')
  try {
    const page = await currentPdfDoc.getPage(num)
    const viewport = page.getViewport({ scale: 2.0 })
    pdfCanvasRef.value.width = viewport.width
    pdfCanvasRef.value.height = viewport.height
    if (pdfBodyRef.value) pdfBodyRef.value.scrollTop = 0
    await page.render({ canvasContext: ctx, viewport }).promise
  } catch (err) {
    console.error('渲染单页失败', err)
  }
}

const changePdfPage = (delta) => {
  renderPdfPage(modals.pdf.page + delta)
}
const closePdfViewer = () => {
  modals.pdf.show = false
  currentPreviewUrl = null
  currentPdfDoc = null
}

const printPreview = async (isPdf) => {
  if (!currentPreviewUrl) return
  showMsg('准备系统打印引擎...', false)
  try {
    if (isPdf) {
      const ifr = document.createElement('iframe')
      ifr.style.cssText =
        'visibility:hidden;position:fixed;right:0;bottom:0;width:0;height:0;border:none;'
      ifr.src = currentPreviewUrl
      document.body.appendChild(ifr)
      ifr.onload = () =>
        setTimeout(() => {
          ifr.contentWindow.print()
          setTimeout(() => document.body.removeChild(ifr), 60000)
          showMsg('打印调起成功！')
        }, 500)
    } else {
      const ifr = document.createElement('iframe')
      ifr.style.cssText =
        'visibility:hidden;position:fixed;right:0;bottom:0;width:0;height:0;border:none;'
      document.body.appendChild(ifr)
      const doc = ifr.contentWindow.document
      doc.write(
        `<html><head><style>@media print { @page { margin: 0; } body { margin: 0; display: flex; justify-content: center; align-items: center; } img { max-width: 100%; max-height: 100vh; object-fit: contain; } }</style></head><body><img src="${currentPreviewUrl}" onload="setTimeout(()=>window.print(), 300)"/></body></html>`
      )
      doc.close()
      setTimeout(() => {
        document.body.removeChild(ifr)
        showMsg('打印调起成功！')
      }, 5000)
    }
  } catch (err) {
    console.error(err)
    showMsg('打印失败: ' + err.message, true)
  }
}

const uploadFiles = async (e) => {
  const files = e.target.files
  if (!files.length) return
  showProgress('上传文件')
  try {
    for (let i = 0; i < files.length; i++) {
      updateProgress((i / files.length) * 100, `上传中: ${files[i].name}`)
      await s3Client.value
        .upload({
          Bucket: currentBucket.value,
          Key: currentPrefix.value + files[i].name,
          Body: files[i],
          ContentType: files[i].type
        })
        .promise()
    }
    updateProgress(100, '上传完成')
    setTimeout(() => {
      modals.progress.show = false
      loadObjects()
    }, 800)
  } catch (err) {
    console.error(err)
    showMsg('上传失败', true)
    modals.progress.show = false
  }
  e.target.value = ''
}

// 🌟【核心突破】：放弃由于签名引发 403 的 AWS 下载，直接用原生 fetch 读取公开直链并触发下载
const downloadObject = async (key, name) => {
  showProgress(`原生极速拉取中: ${name}`)
  try {
    const url = getPublicUrl(key)
    const res = await fetch(url)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)

    const blob = await res.blob()
    const blobUrl = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.style.display = 'none'
    a.href = blobUrl
    a.download = name
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)

    URL.revokeObjectURL(blobUrl)
    updateProgress(100, '下载完成')
    setTimeout(() => (modals.progress.show = false), 800)
  } catch (err) {
    console.error(err)
    showMsg('下载失败: ' + err.message, true)
    modals.progress.show = false
  }
}

const downloadFolder = async (prefix) => {
  const folderName = prefix.slice(currentPrefix.value.length, -1) || 'folder'
  showProgress(`打包文件夹: ${folderName}`)
  try {
    const JSZip = getWindow().JSZip
    const zip = new JSZip()
    let files = []
    let trunc = true
    let tok = undefined
    updateProgress(5, '扫描云端结构...')
    while (trunc) {
      const d = await s3Client.value
        .listObjectsV2({ Bucket: currentBucket.value, Prefix: prefix, ContinuationToken: tok })
        .promise()
      if (d.Contents)
        d.Contents.forEach((i) => {
          if (!i.Key.endsWith('/')) files.push(i.Key)
        })
      trunc = d.IsTruncated
      tok = d.NextContinuationToken
    }
    if (files.length === 0) {
      modals.progress.show = false
      return showMsg('空文件夹', true)
    }
    for (let i = 0; i < files.length; i++) {
      updateProgress(5 + (i / files.length) * 45, `拉取数据 ${i + 1}/${files.length}`)
      const res = await fetch(getPublicUrl(files[i]))
      if (res.ok) {
        const blob = await res.blob()
        zip.file(files[i].replace(currentPrefix.value, ''), blob)
      }
    }
    const blob = await zip.generateAsync({ type: 'blob' }, (m) =>
      updateProgress(50 + m.percent / 2, `本地压缩: ${m.percent.toFixed(1)}%`)
    )
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${folderName}_备份.zip`
    a.click()
    updateProgress(100, '打包完成！')
    setTimeout(() => (modals.progress.show = false), 800)
  } catch (err) {
    console.error(err)
    showMsg('打包失败: ' + err.message, true)
    modals.progress.show = false
  }
}

const batchDownload = async () => {
  if (!selectedFiles.value.length) return alert('请先勾选文件')
  showProgress('批量打包')
  try {
    const JSZip = getWindow().JSZip
    const zip = new JSZip()
    let files = new Set()
    updateProgress(5, '解析目录树...')
    for (let k of selectedFiles.value) {
      if (k.endsWith('/')) {
        let t = true
        let tok = undefined
        while (t) {
          const d = await s3Client.value
            .listObjectsV2({ Bucket: currentBucket.value, Prefix: k, ContinuationToken: tok })
            .promise()
          if (d.Contents)
            d.Contents.forEach((i) => {
              if (!i.Key.endsWith('/')) files.add(i.Key)
            })
          t = d.IsTruncated
          tok = d.NextContinuationToken
        }
      } else files.add(k)
    }
    const arr = Array.from(files)
    if (arr.length === 0) {
      modals.progress.show = false
      return showMsg('无有效文件', true)
    }
    for (let i = 0; i < arr.length; i++) {
      updateProgress(5 + (i / arr.length) * 45, `拉取数据 ${i + 1}/${arr.length}`)
      const res = await fetch(getPublicUrl(arr[i]))
      if (res.ok) {
        const blob = await res.blob()
        zip.file(
          arr[i].startsWith(currentPrefix.value) ? arr[i].replace(currentPrefix.value, '') : arr[i],
          blob
        )
      }
    }
    const blob = await zip.generateAsync({ type: 'blob' }, (m) =>
      updateProgress(50 + m.percent / 2, `压缩: ${m.percent.toFixed(1)}%`)
    )
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `批量下载.zip`
    a.click()
    updateProgress(100, '完成！')
    setTimeout(() => {
      modals.progress.show = false
      selectedFiles.value = []
    }, 800)
  } catch (err) {
    console.error(err)
    showMsg('下载失败', true)
    modals.progress.show = false
  }
}

const confirmInput = () => {
  if (modals.input.callback) modals.input.callback()
  modals.input.show = false
}

const openCreatePathModal = () => {
  modals.input = {
    show: true,
    isConfirm: false,
    title: '新建路径',
    placeholder: '如: 2026/02',
    val: '',
    callback: async () => {
      let p = safeArg(modals.input.val)
      if (!p) return
      try {
        await s3Client.value
          .putObject({ Bucket: currentBucket.value, Key: currentPrefix.value + p + '/', Body: '' })
          .promise()
        loadObjects()
      } catch (err) {
        console.error(err)
        showMsg('新建失败', true)
      }
    }
  }
}

const renameFolder = (oldPrefix) => {
  const oldName = oldPrefix.slice(currentPrefix.value.length, -1)
  modals.input = {
    show: true,
    isConfirm: false,
    title: '重命名文件夹',
    val: oldName,
    callback: async () => {
      let n = safeArg(modals.input.val)
      if (!n || n === oldName || n.includes('/')) return
      const newPre = currentPrefix.value + n + '/'
      showMsg('正在执行重命名...', false)
      try {
        let t = true
        let tok = undefined
        while (t) {
          const d = await s3Client.value
            .listObjectsV2({
              Bucket: currentBucket.value,
              Prefix: oldPrefix,
              ContinuationToken: tok
            })
            .promise()
          if (d.Contents.length) {
            for (let i of d.Contents)
              await s3Client.value
                .copyObject({
                  Bucket: currentBucket.value,
                  CopySource: `${currentBucket.value}/${encodeURIComponent(i.Key).replace(/%2F/g, '/')}`,
                  Key: i.Key.replace(oldPrefix, newPre)
                })
                .promise()
            await s3Client.value
              .deleteObjects({
                Bucket: currentBucket.value,
                Delete: { Objects: d.Contents.map(({ Key }) => ({ Key })) }
              })
              .promise()
          }
          t = d.IsTruncated
          tok = d.NextContinuationToken
        }
        loadObjects()
      } catch (err) {
        console.error(err)
        showMsg('重命名失败', true)
      }
    }
  }
}

const renameFile = (oldKey, oldName) => {
  modals.input = {
    show: true,
    isConfirm: false,
    title: '重命名文件',
    val: oldName,
    callback: async () => {
      let n = safeArg(modals.input.val)
      if (!n || n === oldName || n.includes('/')) return
      const newKey = oldKey.substring(0, oldKey.lastIndexOf('/') + 1) + n
      showMsg('执行重命名...', false)
      try {
        await s3Client.value
          .copyObject({
            Bucket: currentBucket.value,
            CopySource: `${currentBucket.value}/${encodeURIComponent(oldKey).replace(/%2F/g, '/')}`,
            Key: newKey
          })
          .promise()
        await s3Client.value.deleteObject({ Bucket: currentBucket.value, Key: oldKey }).promise()
        loadObjects()
      } catch (err) {
        console.error(err)
        showMsg('重命名失败', true)
      }
    }
  }
}

const deleteObject = (key) => {
  modals.input = {
    show: true,
    isConfirm: true,
    title: '删除文件',
    msg: '确定要永久删除此文件吗？',
    callback: async () => {
      try {
        await s3Client.value.deleteObject({ Bucket: currentBucket.value, Key: key }).promise()
        loadObjects()
      } catch (err) {
        console.error(err)
        showMsg('删除失败', true)
      }
    }
  }
}

const deleteFolderRecursive = (prefix) => {
  modals.input = {
    show: true,
    isConfirm: true,
    title: '危险操作',
    msg: '确定永久删除此文件夹及其内部所有内容吗？',
    callback: async () => {
      showMsg('正在清理...')
      try {
        let t = true
        let tok = undefined
        while (t) {
          const d = await s3Client.value
            .listObjectsV2({ Bucket: currentBucket.value, Prefix: prefix, ContinuationToken: tok })
            .promise()
          if (d.Contents.length)
            await s3Client.value
              .deleteObjects({
                Bucket: currentBucket.value,
                Delete: { Objects: d.Contents.map(({ Key }) => ({ Key })) }
              })
              .promise()
          t = d.IsTruncated
          tok = d.NextContinuationToken
        }
        loadObjects()
      } catch (err) {
        console.error(err)
        showMsg('删除失败', true)
      }
    }
  }
}

const batchDelete = () => {
  if (!selectedFiles.value.length) return
  modals.input = {
    show: true,
    isConfirm: true,
    title: '批量删除',
    msg: `将删除 ${selectedFiles.value.length} 项内容，不可恢复！`,
    callback: async () => {
      showMsg('批量清理中...')
      try {
        let keys = new Set()
        for (let k of selectedFiles.value) {
          if (k.endsWith('/')) {
            let t = true
            let tok = undefined
            while (t) {
              const d = await s3Client.value
                .listObjectsV2({ Bucket: currentBucket.value, Prefix: k, ContinuationToken: tok })
                .promise()
              if (d.Contents) d.Contents.forEach((i) => keys.add(i.Key))
              t = d.IsTruncated
              tok = d.NextContinuationToken
            }
          } else keys.add(k)
        }
        const arr = Array.from(keys)
        for (let i = 0; i < arr.length; i += 1000)
          await s3Client.value
            .deleteObjects({
              Bucket: currentBucket.value,
              Delete: { Objects: arr.slice(i, i + 1000).map((Key) => ({ Key })) }
            })
            .promise()
        selectedFiles.value = []
        loadObjects()
      } catch (err) {
        console.error(err)
        showMsg('删除失败', true)
      }
    }
  }
}

const flattenedTree = computed(() => {
  let result = []
  const traverse = (node, depth, isVisible) => {
    if (node.path !== '') {
      result.push({
        path: node.path,
        name: node.name,
        depth,
        hasChildren: Object.keys(node.children).length > 0,
        expanded: node.expanded,
        visible: isVisible
      })
    } else {
      result.push({
        path: '',
        name: '根目录 ( / )',
        depth: 0,
        hasChildren: true,
        expanded: true,
        visible: true
      })
    }
    let childVisible = isVisible && (node.path === '' || node.expanded)
    Object.values(node.children)
      .sort((a, b) => a.name.localeCompare(b.name))
      .forEach((child) => traverse(child, depth + 1, childVisible))
  }
  if (modals.path.rawTree) traverse(modals.path.rawTree, 0, true)
  return result.filter((n) => n.visible)
})

const toggleTreeNode = (nodeData) => {
  const findAndToggle = (node, targetPath) => {
    if (node.path === targetPath) {
      node.expanded = !node.expanded
      return true
    }
    for (let key in node.children) {
      if (findAndToggle(node.children[key], targetPath)) return true
    }
  }
  findAndToggle(modals.path.rawTree, nodeData.path)
}

const openPathSelectModal = async (sourceKey, isFolder) => {
  modals.path = { show: true, loading: true, sourceKey, isFolder, selected: null, rawTree: null }
  try {
    let folders = new Set()
    let t = true
    let tok = undefined
    while (t) {
      const d = await s3Client.value
        .listObjectsV2({ Bucket: currentBucket.value, ContinuationToken: tok })
        .promise()
      if (d.Contents)
        d.Contents.forEach((i) => {
          let p = i.Key.split('/')
          if (!i.Key.endsWith('/')) p.pop()
          else p.pop()
          let b = ''
          for (let x of p) {
            b += x + '/'
            folders.add(b)
          }
        })
      t = d.IsTruncated
      tok = d.NextContinuationToken
    }
    let validFolders = Array.from(folders).sort()
    if (isFolder) validFolders = validFolders.filter((f) => !f.startsWith(sourceKey))

    const root = { path: '', name: 'root', children: {}, expanded: true }
    validFolders.forEach((p) => {
      const parts = p.split('/').filter(Boolean)
      let curr = root
      let curPath = ''
      parts.forEach((part) => {
        curPath += part + '/'
        if (!curr.children[curPath])
          curr.children[curPath] = { path: curPath, name: part, children: {}, expanded: false }
        curr = curr.children[curPath]
      })
    })
    modals.path.rawTree = root
    modals.path.loading = false
  } catch (err) {
    console.error(err)
    showMsg('解析目录树失败', true)
    modals.path.show = false
  }
}

const confirmMove = async () => {
  const target = modals.path.selected
  const source = modals.path.sourceKey
  modals.path.show = false
  showMsg('正在执行转移...', false)
  try {
    if (modals.path.isFolder) {
      const fName = source.split('/').filter(Boolean).pop()
      const newPre = target + fName + '/'
      if (source === newPre) return showMsg('路径未变')
      let t = true
      let tok = undefined
      while (t) {
        const d = await s3Client.value
          .listObjectsV2({ Bucket: currentBucket.value, Prefix: source, ContinuationToken: tok })
          .promise()
        if (d.Contents.length) {
          for (let i of d.Contents)
            await s3Client.value
              .copyObject({
                Bucket: currentBucket.value,
                CopySource: `${currentBucket.value}/${encodeURIComponent(i.Key).replace(/%2F/g, '/')}`,
                Key: i.Key.replace(source, newPre)
              })
              .promise()
          await s3Client.value
            .deleteObjects({
              Bucket: currentBucket.value,
              Delete: { Objects: d.Contents.map(({ Key }) => ({ Key })) }
            })
            .promise()
        }
        t = d.IsTruncated
        tok = d.NextContinuationToken
      }
    } else {
      const fName = source.split('/').pop()
      const newKey = target + fName
      if (source === newKey) return showMsg('路径未变')
      await s3Client.value
        .copyObject({
          Bucket: currentBucket.value,
          CopySource: `${currentBucket.value}/${encodeURIComponent(source).replace(/%2F/g, '/')}`,
          Key: newKey
        })
        .promise()
      await s3Client.value.deleteObject({ Bucket: currentBucket.value, Key: source }).promise()
    }
    loadObjects()
  } catch (err) {
    console.error(err)
    showMsg('移动失败', true)
  }
}
// 🌟【新增】：智能硬盘缓存引擎
const getCachedMediaUrl = async (publicUrl) => {
  try {
    // 打开名为 minio-media-cache 的本地数据库
    const cache = await caches.open('minio-media-cache')
    // 找找看硬盘里有没有存过这张图
    const cachedResponse = await cache.match(publicUrl)

    if (cachedResponse) {
      // 如果硬盘里有，直接转成内存地址秒开！不耗费1KB流量
      const blob = await cachedResponse.blob()
      return URL.createObjectURL(blob)
    } else {
      // 如果硬盘里没有，就去请求网络，顺便存一份到硬盘里
      fetch(publicUrl).then((response) => {
        if (response.ok) cache.put(publicUrl, response.clone())
      })
      return publicUrl
    }
  } catch (e) {
    console.log(e)
    return publicUrl
  }
}
</script>

<style scoped>
.app-wrapper {
  font-family: 'Segoe UI', Tahoma, sans-serif;
  max-width: 1250px;
  margin: 0 auto;
  color: #333;
  padding: 20px;
}
.login-panel {
  max-width: 400px;
  margin: 50px auto;
  background: #fff;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}
.form-group {
  margin-bottom: 15px;
}
.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
  font-size: 14px;
  color: #555;
}
.form-group input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-sizing: border-box;
}
.error-text {
  color: #dc3545;
  font-size: 13px;
  margin-top: 10px;
}

.control-panel {
  background: #fff;
  padding: 15px 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 15px;
}
.panel-group {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}
.divider {
  width: 1px;
  height: 30px;
  background: #ddd;
  margin: 0 5px;
}

button {
  background-color: #007bff;
  color: white;
  border: none;
  padding: 8px 15px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  font-weight: bold;
  transition: background 0.2s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}
button:hover {
  background-color: #0056b3;
}
button:disabled {
  background-color: #a0c4ff;
  cursor: not-allowed;
  opacity: 0.7;
}
.icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
}
.icon-wrap svg {
  width: 16px;
  height: 16px;
}

input[type='text'] {
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 13px;
}
.btn-delete {
  background-color: #dc3545;
}
.btn-delete:hover {
  background-color: #c82333;
}
.btn-download {
  background-color: #17a2b8;
}
.btn-download:hover {
  background-color: #138496;
}
.btn-secondary {
  background-color: #6c757d;
}
.btn-secondary:hover {
  background-color: #5a6268;
}
.btn-search {
  background-color: #28a745;
}
.btn-search:hover {
  background-color: #218838;
}
.btn-batch {
  background-color: #fd7e14;
}
.btn-batch:hover {
  background-color: #e86e0c;
}
.btn-move {
  background-color: #6f42c1;
}
.btn-move:hover {
  background-color: #5a329f;
}
.text-link {
  color: #007bff;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 5px;
}

.breadcrumb {
  width: 100%;
  background: #e9ecef;
  padding: 10px 15px;
  border-radius: 6px;
  margin-bottom: 20px;
  font-size: 15px;
  color: #495057;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}
.breadcrumb span {
  cursor: pointer;
  color: #007bff;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 4px;
}
.breadcrumb span:hover {
  text-decoration: underline;
}
.breadcrumb .separator {
  margin: 0 8px;
  color: #6c757d;
  cursor: default;
  text-decoration: none !important;
}
.breadcrumb .current {
  color: #495057;
  font-weight: normal;
  cursor: default;
  text-decoration: none !important;
}

.gallery {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
  gap: 20px;
}
.card {
  background: #fff;
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 10px;
  text-align: center;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
  transition: transform 0.2s;
  display: flex;
  flex-direction: column;
  position: relative;
}
.card:hover {
  transform: translateY(-3px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  border-color: #b8daff;
}
.card p {
  font-size: 13px;
  color: #555;
  word-break: break-all;
  margin: 8px 0;
  height: 36px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}
.folder-card {
  cursor: pointer;
  border: 2px dashed #b8daff;
  background-color: #f8fbff;
}
.folder-card:hover {
  border-color: #007bff;
  background-color: #e9f2ff;
}
.folder-icon {
  margin: 15px 0 10px 0;
  display: flex;
  justify-content: center;
}

.card-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
  margin-top: auto;
  padding-top: 8px;
  border-top: 1px dashed #eee;
}
.card-actions button {
  padding: 6px 0;
  font-size: 12px;
  gap: 4px;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}
.file-checkbox {
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 10;
  transform: scale(1.5);
  cursor: pointer;
  box-shadow: 0 0 5px rgba(255, 255, 255, 0.8);
}

.file-preview {
  height: 150px;
  border-radius: 4px;
  background-color: #fafafa;
  margin-bottom: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  position: relative;
  border: 1px solid #f0f0f0;
  flex-direction: column;
  cursor: pointer;
}
.file-preview img,
.pdf-thumb-canvas {
  width: 100%;
  height: 100%;
  object-fit: contain;
  transition: transform 0.2s;
}
.file-preview img:hover {
  transform: scale(1.05);
}
.loading-text {
  font-size: 12px;
  color: #888;
  font-weight: bold;
}
.doc-icon {
  margin-bottom: 8px;
}

.global-status {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: #28a745;
  color: white;
  padding: 12px 25px;
  border-radius: 6px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  font-weight: bold;
  z-index: 30000;
  animation: fadeIn 0.3s ease;
}
.global-status.is-error {
  background: #dc3545;
}

/* 进度条样式 */
.progress-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  z-index: 20000;
  display: flex;
  justify-content: center;
  align-items: center;
  backdrop-filter: blur(3px);
}
.progress-container {
  width: 450px;
  background: #fff;
  border-radius: 10px;
  padding: 25px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  text-align: center;
}
.progress-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin-bottom: 15px;
}
.progress-bar-bg {
  width: 100%;
  height: 12px;
  background: #e9ecef;
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 15px;
}
.progress-bar-fill {
  width: 0%;
  height: 100%;
  background: linear-gradient(90deg, #17a2b8, #007bff);
  transition: width 0.3s ease;
}
.progress-text {
  font-size: 13px;
  color: #666;
  font-family: monospace;
}

/* 模态框通用 */
.input-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  z-index: 10000;
  display: flex;
  justify-content: center;
  align-items: center;
  backdrop-filter: blur(2px);
}
.input-modal-container {
  width: 400px;
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  animation: fadeIn 0.2s ease;
}
.input-modal-header {
  background: #f8f9fa;
  padding: 15px 20px;
  border-bottom: 1px solid #dee2e6;
}
.input-modal-header h3 {
  margin: 0;
  font-size: 16px;
  color: #333;
}
.input-modal-body {
  padding: 20px;
  font-size: 14px;
  line-height: 1.5;
  color: #444;
}
.input-modal-input {
  width: 100%;
  padding: 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 14px;
  box-sizing: border-box;
  margin-top: 10px;
}
.input-modal-footer {
  padding: 15px 20px;
  background: #f8f9fa;
  border-top: 1px solid #dee2e6;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

/* 图片预览 */
.image-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.85);
  z-index: 10000;
  display: flex;
  justify-content: center;
  align-items: center;
  backdrop-filter: blur(5px);
}
.image-modal-content {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.image-modal-content img {
  max-width: 90vw;
  max-height: 85vh;
  border-radius: 4px;
  background: white;
  object-fit: contain;
}
.image-modal-title {
  color: #fff;
  margin-top: 15px;
  font-size: 16px;
  font-weight: bold;
}
.image-modal-controls {
  position: fixed;
  top: 20px;
  right: 30px;
  display: flex;
  gap: 15px;
}
.image-modal-btn {
  background: rgba(0, 0, 0, 0.5);
  border-radius: 50%;
  width: 45px;
  height: 45px;
  padding: 0;
  transition: all 0.2s;
  color: white;
  border: none;
  cursor: pointer;
}
.image-modal-btn:hover {
  background: rgba(0, 0, 0, 0.8);
  transform: scale(1.1);
}

/* PDF 阅读 */
.pdf-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  z-index: 9999;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}
.pdf-modal-container {
  width: 90%;
  max-width: 900px;
  height: 90vh;
  background: #e9ecef;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.pdf-modal-header {
  background: #343a40;
  color: white;
  padding: 15px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.pdf-modal-header h3 {
  margin: 0;
  font-size: 16px;
}
.pdf-modal-body {
  flex: 1;
  overflow: auto;
  display: flex;
  padding: 20px;
  background: #525659;
}
.pdf-modal-body canvas {
  margin: auto;
  max-width: 100%;
  background-color: #fff;
}
.pdf-modal-footer {
  background: #343a40;
  padding: 10px 20px;
  display: flex;
  justify-content: center;
  gap: 15px;
  color: white;
}

/* 响应式树状列表 */
.tree-container {
  max-height: 300px;
  overflow-y: auto;
  background: #fff;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  padding: 10px 0;
  margin-top: 10px;
}
.tree-item {
  display: flex;
  align-items: center;
  padding: 6px 15px;
  cursor: pointer;
  gap: 8px;
  font-size: 14px;
  transition: background 0.1s;
}
.tree-item:hover {
  background-color: #f1f3f5;
}
.tree-item.selected {
  background-color: #e7f1ff;
  color: #007bff;
  font-weight: bold;
}
.tree-toggle {
  width: 20px;
  height: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  color: #666;
}
.tree-toggle.empty {
  pointer-events: none;
  opacity: 0;
}
.tree-toggle:hover {
  background-color: #e2e6ea;
  border-radius: 3px;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
/* 现代化的“新增”按钮样式 */
.btn-add {
  background: linear-gradient(135deg, #007bff, #0056b3); /* 微渐变，增加立体感 */
  color: #ffffff;
  border: none;
  padding: 9px 20px; /* 增加左右留白，让按钮有呼吸感 */
  font-size: 14px;
  font-weight: 600; /* 字体稍微加粗，增加视觉层级 */
  border-radius: 6px; /* 恰到好处的圆角 */
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px; /* 图标和文字的间距 */
  box-shadow: 0 4px 10px rgba(0, 123, 255, 0.25); /* 柔和的阴影 */
  transition: all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1); /* 平滑动效 */
  user-select: none; /* 防止双击时选中文字 */
}

/* 鼠标悬浮时的微动效：微微抬起 + 阴影加深 */
.btn-add:hover {
  background: linear-gradient(135deg, #0069d9, #004a99);
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(0, 123, 255, 0.35);
}

/* 鼠标点击时的真实按压反馈 */
.btn-add:active {
  transform: translateY(1px);
  box-shadow: 0 2px 5px rgba(0, 123, 255, 0.2);
}
/* ==================== 登录页专属高级样式 ==================== */
.login-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  /* 现代化的动态微渐变背景 */
  background: linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.login-card {
  background: #ffffff;
  width: 400px;
  padding: 45px 40px;
  border-radius: 16px;
  /* 苹果风格的柔和多层阴影 */
  box-shadow:
    0 10px 40px rgba(0, 0, 0, 0.08),
    0 1px 3px rgba(0, 0, 0, 0.03);
  text-align: center;
  animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.login-header {
  margin-bottom: 35px;
}

.logo-circle {
  width: 80px;
  height: 80px;
  margin: 0 auto 15px;
  background: #f0f7ff;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: inset 0 2px 5px rgba(0, 123, 255, 0.1);
}

.login-header h2 {
  margin: 0 0 8px 0;
  color: #2c3e50;
  font-size: 24px;
  font-weight: 700;
  letter-spacing: 0.5px;
}

.login-header p {
  margin: 0;
  color: #8898aa;
  font-size: 14px;
}

.input-group {
  position: relative;
  margin-bottom: 20px;
}

.input-icon {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: #adb5bd;
  display: flex;
  transition: color 0.3s ease;
}

.input-group input {
  width: 100%;
  padding: 14px 14px 14px 44px; /* 左侧留出图标空间 */
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  font-size: 14px;
  color: #333;
  background: #f8fafc;
  box-sizing: border-box;
  transition: all 0.3s ease;
}

/* 输入框焦点动效 */
.input-group input:focus {
  background: #ffffff;
  border-color: #007bff;
  box-shadow: 0 0 0 4px rgba(0, 123, 255, 0.15);
  outline: none;
}

/* 当输入框聚焦时，图标也跟着变蓝 */
.input-group input:focus + .input-icon,
.input-group input:focus ~ .input-icon {
  color: #007bff;
}

.btn-login {
  width: 100%;
  margin-top: 10px;
  background: linear-gradient(135deg, #007bff, #0056b3);
  color: #ffffff;
  border: none;
  padding: 14px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 10px;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(0, 123, 255, 0.3);
  transition: all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1);
  letter-spacing: 1px;
}

.btn-login:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 123, 255, 0.4);
}

.btn-login:active:not(:disabled) {
  transform: translateY(1px);
  box-shadow: 0 2px 5px rgba(0, 123, 255, 0.2);
}

.btn-login:disabled {
  background: #a0c4ff;
  box-shadow: none;
  cursor: not-allowed;
}

.login-error {
  margin-top: 20px;
  padding: 12px;
  background: #fff5f5;
  color: #e53e3e;
  border: 1px solid #feb2b2;
  border-radius: 8px;
  font-size: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  animation: shake 0.4s ease-in-out;
}

/* 进场动画 */
@keyframes slideUp {
  0% {
    opacity: 0;
    transform: translateY(20px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 错误提示颤抖动画 */
@keyframes shake {
  0%,
  100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-5px);
  }
  75% {
    transform: translateX(5px);
  }
}
</style>

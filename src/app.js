
import * as monaco from 'monaco-editor'
import SQLSnippets from './core/snippets'
import Vue from 'vue'
export default Vue.extend({
  name: 'SqlEditor',
  props: {
    value: {
      type: String,
      default: ''
    },
    dbs: {
      type: Array,
      default: () => []
    },
    onInputField: {
      type: Function,
      default: () => []
    },
    onInputTableAlia: {
      type: Function,
      default: () => []
    },
    width: {
      type: Number,
      default: 500
    },
    height: {
      type: Number,
      default: 500
    },
    theme: {
      type: String,
      default: 'vs'
    },
    customKeywords: {
      type: Array,
      default: () => []
    },
    triggerCharacters: {
      type: Array,
      default: () => []
    },
    options: {
      type: Object,
      default: () => ({
        theme: 'vs',
        contextmenu: false,
        suggestOnTriggerCharacters: true,
        fontSize: '16px'
      })
    }
  },
  data() {
    return {
      monacoEditor: null,
      completionItemProvider: null,
      sqlSnippets: null
    }
  },
  watch: {
    dbs: {
      deep: true,
      async handler() {
        this.sqlSnippets.setDbSchema(this.dbs)
      }
    },
    width: {
      immediate: true,
      handler() {
        this.monacoEditor &&
          this.monacoEditor.layout({ width: this.width, height: this.height })
      }
    },
    height: {
      immediate: true,
      handler() {
        this.monacoEditor &&
          this.monacoEditor.layout({ width: this.width, height: this.height })
      }
    },
    theme: {
      immediate: true,
      handler() {
        // 设置编辑器主题
        monaco.editor.setTheme(this.theme)
      }
    }
  },
  async mounted() {
    this.initEditor()
  },
  beforeDestroy() {
    this.$emit('onDidChangeCursorSelection', '')
    this.completionItemProvider.dispose()
    this.monacoEditor.dispose()
  },
  methods: {
    /**
     * 初始化编辑器
     */
    async initEditor() {
      // 实例化snippets
      this.sqlSnippets = new SQLSnippets(
        monaco,
        this.customKeywords,
        this.onInputField,
        this.onInputTableAlia,
        this.dbs
      )
      // 设置编辑器语言
      this.completionItemProvider = monaco.languages.registerCompletionItemProvider(
        'sql',
        {
          triggerCharacters: [' ', '.', ...this.triggerCharacters],
          provideCompletionItems: (model, position) =>
            this.sqlSnippets.provideCompletionItems(model, position)
        }
      )
      // 初始化编辑器
      this.monacoEditor = monaco.editor.create(this.$el, {
        value: this.value,
        language: 'sql',
        ...this.options
      })
      // 重新渲染
      this.monacoEditor.layout({ width: this.width, height: this.height })
      // 监听变化
      this.monacoEditor.onDidChangeModelContent(e => {
        this.caretOffset = e.changes[0].rangeOffset // 获取光标位置
        this.$emit('input', this.monacoEditor.getValue())
      })
      this.monacoEditor.onDidChangeCursorSelection(e => {
        const selectedText = this.monacoEditor.getModel().getValueInRange({
          startLineNumber: e.selection.startLineNumber,
          startColumn: e.selection.startColumn,
          endLineNumber: e.selection.endLineNumber,
          endColumn: e.selection.endColumn
        })
        this.$emit('onDidChangeCursorSelection', selectedText)
      })
      this.monacoEditor.addCommand(
        monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter,
        () => {
          this.$emit('ctrl-enter')
        }
      )
      this.monacoEditor.addCommand(
        monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_I,
        () => {
          // 插入${ } 并移动光标至${|}
          // 获取当前光标位置
          const position = this.monacoEditor.getPosition()
          // 新建range实例
          const range = new monaco.Range(
            position.lineNumber,
            position.column,
            position.lineNumber,
            position.column
          )
          // 需插入文本配置
          const options = {
            range: range,
            text: ' ${  }',
            forceMoveMarkers: true
          }
          // 插入文本
          this.monacoEditor.executeEdits('my-source', [options])
          // 移动光标
          this.monacoEditor.setPosition({
            column: position.column + 3,
            lineNumber: position.lineNumber
          })
        }
      )
    }
  },
  render(h) {
    return h('div')
  }
})

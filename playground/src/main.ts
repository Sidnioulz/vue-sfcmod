import { createApp } from 'vue'

import App from './App.vue'
import './main.postcss'
import CodeMirror from './components/CodeMirror.vue'
import Editor from './components/Editor.vue'
import FixtureSelect from './components/FixtureSelect.vue'
import Navbar from './components/Navbar.vue'
import OpenInEditor from './components/OpenInEditor.vue'
import Panels from './components/Panels.vue'
import TransformView from './components/TransformView.vue'
import TransformationSelect from './components/TransformationSelect.vue'
import { initStore } from './store'

const app = createApp(App)

app.component('Editor', Editor)
app.component('Navbar', Navbar)
app.component('TransformationSelect', TransformationSelect)
app.component('CodeMirror', CodeMirror)
app.component('Panels', Panels)
app.component('TransformView', TransformView)
app.component('OpenInEditor', OpenInEditor)
app.component('FixtureSelect', FixtureSelect)

app.mount('#app')

initStore()

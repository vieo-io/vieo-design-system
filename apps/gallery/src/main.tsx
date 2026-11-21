import '@vieo-io/tokens/tokens.css'
import '@vieo-io/tokens/designs.css'
import '@vieo-io/tokens/palettes.css'
import '@vieo-io/ui/styles.css'
import './gallery.css'
import { render } from '@solidjs/web'
import { Gallery } from './Gallery'

const root = document.getElementById('root')
if (!root) throw new Error('index.html has no #root')
render(() => <Gallery />, root)

const links = [...document.querySelectorAll('[data-artwork]')]
const viewer = document.querySelector('#artwork-viewer')
const stage = document.querySelector('#viewer-stage')
const heading = document.querySelector('#viewer-title')
const position = document.querySelector('#viewer-position')
const message = document.querySelector('#viewer-message')
const previous = document.querySelector('#viewer-previous')
const next = document.querySelector('#viewer-next')
const size = document.querySelector('#viewer-size')
const retry = document.querySelector('#viewer-retry')
const reading = document.querySelector('#viewer-reading')
let selected = 0
let version = 0
let opener

function set_size(actual) {
  stage.dataset.size = actual ? 'actual' : 'fit'
  size.textContent = actual ? (stage.dataset.view === 'page' ? 'Fit width' : 'Fit image') : 'Actual size'
}

function show_artwork(index) {
  selected = Math.max(0, Math.min(links.length - 1, index))
  const link = links[selected]
  const request_version = ++version
  const focused = document.activeElement
  stage.dataset.view = link.dataset.view || 'image'
  set_size(stage.dataset.size === 'actual')
  reading.hidden = stage.dataset.view !== 'page'
  stage.setAttribute('aria-describedby', reading.hidden ? 'viewer-hint' : 'viewer-reading viewer-hint')
  heading.textContent = link.dataset.artwork
  position.textContent = `${selected + 1} / ${links.length}`
  previous.disabled = selected === 0
  next.disabled = selected === links.length - 1
  if ((focused === previous && previous.disabled) || (focused === next && next.disabled) || focused === retry) {
    stage.focus({preventScroll: true})
  }
  message.textContent = 'Loading image…'
  retry.hidden = true
  stage.setAttribute('aria-busy', 'true')
  const image = new Image()
  image.alt = link.querySelector('img').alt
  image.onload = () => {
    if (request_version !== version) return
    message.textContent = ''
    stage.setAttribute('aria-busy', 'false')
  }
  image.onerror = () => {
    if (request_version !== version) return
    message.textContent = 'This image could not be loaded. Please try again.'
    retry.hidden = false
    stage.setAttribute('aria-busy', 'false')
  }
  stage.replaceChildren(image)
  image.src = link.href
  stage.scrollTo(0, 0)
}

for (const [index, link] of links.entries()) {
  link.addEventListener('click', event => {
    if (!viewer.showModal || event.button !== 0 || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return
    event.preventDefault()
    opener = link
    stage.dataset.size = 'fit'
    show_artwork(index)
    viewer.showModal()
    document.body.classList.add('gallery-open')
    if (stage.dataset.view === 'page') stage.focus({preventScroll: true})
  })
}
document.querySelector('#viewer-close').addEventListener('click', () => viewer.close())
previous.addEventListener('click', () => show_artwork(selected - 1))
next.addEventListener('click', () => show_artwork(selected + 1))
retry.addEventListener('click', () => show_artwork(selected))
size.addEventListener('click', () => {
  const image = stage.querySelector('img')
  const page_top = stage.dataset.view === 'page' && image?.clientHeight ? stage.scrollTop / image.clientHeight : 0
  set_size(stage.dataset.size !== 'actual')
  // Retain the top visible source line while a long page changes scale.
  stage.scrollTo(0, page_top * (image?.clientHeight || 0))
})
viewer.addEventListener('keydown', event => {
  if (event.defaultPrevented || event.isComposing || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return
  // The focused image region owns native reading and panning keys.
  if (document.activeElement === stage && (stage.dataset.size === 'actual' || stage.dataset.view === 'page') && event.key.startsWith('Arrow')) return
  const delta = {ArrowRight: 1, ArrowLeft: -1, j: 1, k: -1}[event.key]
  if (delta) { event.preventDefault(); show_artwork(selected + delta) }
})
viewer.addEventListener('close', () => {
  version++
  document.body.classList.remove('gallery-open')
  stage.replaceChildren()
  opener?.focus({preventScroll: true})
})

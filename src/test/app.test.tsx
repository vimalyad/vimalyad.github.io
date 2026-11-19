import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup, within, act } from '@testing-library/react'
import App from '../App'
import { useStore, type ThemeId } from '../store'
import { profile } from '../data/profile'
import { projects } from '../data/projects'

const SECTIONS = ['about', 'experience', 'projects', 'archive', 'contact']

async function renderTheme(theme: ThemeId) {
  useStore.setState({ theme, project: null, paletteOpen: false })
  const utils = render(<App />)
  await screen.findAllByText(new RegExp(profile.name), undefined, { timeout: 5000 })
  return utils
}

beforeEach(() => localStorage.clear())
afterEach(cleanup)

describe.each<ThemeId>(['grimoire', 'lab', 'cluster', 'resume'])('%s design', (theme) => {
  it('renders every shared section and the featured projects', async () => {
    const { container } = await renderTheme(theme)
    expect(document.documentElement.dataset.theme).toBe(theme)
    for (const id of SECTIONS) expect(container.querySelector(`#${id}`), `#${id}`).not.toBeNull()
    for (const p of projects.filter((x) => x.featured)) {
      expect(container.textContent).toContain(theme === 'cluster' ? p.slug : p.name)
    }
  })

  it('opens a project dialog from the page', async () => {
    await renderTheme(theme)
    const p = projects.find((x) => x.slug === 'version-db')!
    const trigger =
      theme === 'cluster'
        ? screen.getAllByRole('button', { name: /version-db/ })[0]
        : theme === 'lab'
          ? within(screen.getByRole('heading', { name: p.name }).closest('article')!).getByRole('button', { name: 'Details' })
          : screen.getAllByRole('button', { name: new RegExp(p.name) })[0]
    fireEvent.click(trigger)
    const dialog = await screen.findByRole('dialog', { name: p.name })
    expect(within(dialog).getByText(p.tagline)).toBeTruthy()
    expect(within(dialog).getByRole('link', { name: /Source on GitHub/ }).getAttribute('href')).toBe(p.repo)
    fireEvent.click(within(dialog).getByRole('button', { name: 'Close' }))
    expect(useStore.getState().project).toBeNull()
  })
})

describe('shell', () => {
  it('switches designs from the switcher and remembers the choice', async () => {
    await renderTheme('lab')
    fireEvent.click(screen.getByRole('button', { name: 'Résumé' }))
    expect(useStore.getState().theme).toBe('resume')
    expect(localStorage.getItem('theme')).toBe('resume')
    expect(new URL(location.href).searchParams.get('theme')).toBe('resume')
  })

  it('command palette filters and runs commands with the keyboard', async () => {
    await renderTheme('resume')
    fireEvent.keyDown(window, { key: 'k', ctrlKey: true })
    expect(useStore.getState().paletteOpen).toBe(true)
    const input = screen.getByPlaceholderText(/Jump to/)
    fireEvent.change(input, { target: { value: 'versiondb' } })
    expect(screen.getAllByRole('option')).toHaveLength(1)
    await act(async () => {
      fireEvent.keyDown(input, { key: 'Enter' })
      await new Promise((r) => requestAnimationFrame(r))
    })
    expect(useStore.getState().paletteOpen).toBe(false)
    expect(useStore.getState().project).toBe('version-db')
  })
})

describe('cluster terminal', () => {
  const run = (cmd: string) => {
    const input = screen.getByLabelText('Terminal command')
    fireEvent.change(input, { target: { value: cmd } })
    fireEvent.keyDown(input, { key: 'Enter' })
  }

  it('answers kubectl-style commands', async () => {
    const { container } = await renderTheme('cluster')
    const term = () => container.querySelector('.cl-term-body')!.textContent!
    run('kubectl get pods -n databases')
    expect(term()).toContain('version-db')
    expect(term()).toContain('crdt-relational-db')
    run('kubectl describe pod crdt-relational')
    expect(term()).toContain('Namespace:   databases')
    run('frobnicate')
    expect(term()).toContain('frobnicate: command not found')
    run('clear')
    expect(term()).not.toContain('frobnicate')
  })

  it('tab-completes commands and project names', async () => {
    await renderTheme('cluster')
    const input = screen.getByLabelText('Terminal command') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'kubec' } })
    fireEvent.keyDown(input, { key: 'Tab' })
    expect(input.value).toBe('kubectl ')
    fireEvent.change(input, { target: { value: 'open version' } })
    fireEvent.keyDown(input, { key: 'Tab' })
    expect(input.value).toBe('open version-db ')
  })
})

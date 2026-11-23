import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup, within, act } from '@testing-library/react'
import App from '../App'
import { useStore } from '../store'
import { profile, experience, education } from '../data/profile'
import { projects } from '../data/projects'
import { upstream } from '../data/derived'

const SECTIONS = ['about', 'experience', 'projects', 'archive', 'contact']

async function renderApp() {
  useStore.setState({ project: null, paletteOpen: false })
  const utils = render(<App />)
  await screen.findAllByText(new RegExp(profile.name))
  return utils
}

beforeEach(() => localStorage.clear())
afterEach(cleanup)

describe('grimoire site', () => {
  it('renders every section, role, school, featured project and upstream PR', async () => {
    const { container } = await renderApp()
    for (const id of SECTIONS) expect(container.querySelector(`#${id}`), `#${id}`).not.toBeNull()
    const text = container.textContent!
    for (const r of experience) expect(text).toContain(r.company)
    for (const e of education) expect(text).toContain(e.institution)
    for (const p of projects.filter((x) => x.featured)) expect(text).toContain(p.name)
    for (const u of upstream) expect(text).toContain(u.project)
  })

  it('opens a project dialog from a tome, with source link and demo', async () => {
    await renderApp()
    const p = projects.find((x) => x.slug === 'version-db')!
    fireEvent.click(screen.getAllByRole('button', { name: new RegExp(p.name) })[0])
    const dialog = await screen.findByRole('dialog', { name: p.name })
    expect(within(dialog).getByText(p.tagline)).toBeTruthy()
    expect(within(dialog).getByRole('link', { name: /Source on GitHub/ }).getAttribute('href')).toBe(p.repo)
    expect(within(dialog).getByText(/Spell: Crash & recover/)).toBeTruthy()
    fireEvent.click(within(dialog).getByRole('button', { name: 'Close' }))
    expect(useStore.getState().project).toBeNull()
  })

  it('search button and Ctrl+K open the palette; it filters and runs commands', async () => {
    await renderApp()
    fireEvent.click(screen.getByRole('button', { name: /Search projects and sections/ }))
    expect(useStore.getState().paletteOpen).toBe(true)
    useStore.setState({ paletteOpen: false })
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

  it('has no leftover design switcher', async () => {
    await renderApp()
    expect(screen.queryByRole('navigation', { name: /Choose a design/ })).toBeNull()
    expect(screen.queryByText(/Switch design/)).toBeNull()
  })
})

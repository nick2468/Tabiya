import { useState } from 'react'
import { useCatalog } from './catalog-context'
import { useProgress } from './progress-context'
import { installCourse, installedCourseIds, pickBundle } from './bundles'
import { pgnToCourse } from '../model/bundle'
import { loadCourse } from '../model/course'
import { survivingLines } from '../model/lines'
import type { ContentError, CourseManifest, LoadedCourse } from '../model/types'

/**
 * Adding a course from a file.
 *
 * Three things have to be true before anything is written, and they are worth
 * naming because each one is a way a trainee could lose something.
 *
 * The file has to be a course: it goes through the same loader a folder does,
 * and a file that fails is refused with every error listed and nothing written.
 * It must not be pretending to be a course that ships with the app, because a
 * course id is what the progress file hangs off. And if it replaces a course
 * already installed, the trainee is told how much of their own work survives
 * before they decide, which is SPEC.md section 11's ruling and the check
 * review gate 10 relied on, moved in front of the person it affects.
 */

type Stage =
  | { kind: 'idle' }
  | { kind: 'busy' }
  | { kind: 'errors'; name: string; errors: ContentError[] }
  | {
      kind: 'confirm'
      name: string
      course: LoadedCourse
      manifest: CourseManifest
      files: Record<string, unknown>
      kept: number
      total: number
    }
  | { kind: 'done'; message: string }

export function ImportCourse() {
  const { entries, folder } = useCatalog()
  const { state } = useProgress()
  const [stage, setStage] = useState<Stage>({ kind: 'idle' })

  // The browser build has nowhere to put a course, and says so elsewhere.
  if (!folder) return null

  const start = async () => {
    setStage({ kind: 'busy' })
    let picked
    try {
      picked = await pickBundle()
    } catch (error) {
      setStage({ kind: 'done', message: `That file could not be opened: ${message(error)}` })
      return
    }
    if (!picked) {
      setStage({ kind: 'idle' })
      return
    }

    const read = pgnToCourse(picked.text)
    if (!read.ok || !read.manifest) {
      setStage({ kind: 'errors', name: picked.name, errors: read.errors })
      return
    }

    const loaded = loadCourse(read.manifest, read.files)
    if (!loaded.course) {
      setStage({ kind: 'errors', name: picked.name, errors: loaded.errors })
      return
    }

    const bundled = entries.some(
      (entry) => entry.origin === 'bundled' && entry.course?.id === loaded.course?.id,
    )
    if (bundled) {
      setStage({
        kind: 'errors',
        name: picked.name,
        errors: [
          {
            course: loaded.course.id,
            chapter: 'the bundle',
            path: '',
            message:
              `a course that ships with the app already uses the id "${loaded.course.id}". ` +
              'Two courses with one id would share one drill schedule, so change [CourseId] ' +
              'in the file to something of your own.',
          },
        ],
      })
      return
    }

    let installed: string[] = []
    try {
      installed = await installedCourseIds()
    } catch {
      // Not being able to list the folder is not a reason to refuse: the write
      // below will say so properly if it is a real problem.
    }

    if (installed.includes(loaded.course.id)) {
      const survive = survivingLines(loaded.course, state.learntLines)
      setStage({
        kind: 'confirm',
        name: picked.name,
        course: loaded.course,
        manifest: read.manifest,
        files: read.files,
        kept: survive.kept,
        total: survive.total,
      })
      return
    }

    await write(read.manifest, read.files, loaded.course)
  }

  const write = async (
    manifest: CourseManifest,
    files: Record<string, unknown>,
    course: LoadedCourse,
  ) => {
    setStage({ kind: 'busy' })
    try {
      const where = await installCourse(manifest, files)
      setStage({
        kind: 'done',
        message:
          `${course.title} was installed into ${where}. Restart the app to see it in ` +
          'your courses.',
      })
    } catch (error) {
      // Not "nothing was written". Installing clears the folder's old chapter
      // files before writing the new ones, so a failure part way through can
      // leave a replacement half done. Say what is actually known.
      setStage({
        kind: 'done',
        message:
          `${course.title} was not installed: ${message(error)} If you were replacing a ` +
          'course you already had, open it in the catalog to check it, and import the file ' +
          'again if it is incomplete.',
      })
    }
  }

  return (
    <div className="import-course">
      <button type="button" className="import-open" onClick={() => void start()}>
        Add a course from a file
      </button>
      <p className="hint">
        A course bundle is a <code>.pgn</code> file. It is data and cannot run anything,
        and the app checks every move in it before installing it.
      </p>

      {stage.kind === 'busy' ? <p className="hint">Reading...</p> : null}

      {stage.kind === 'errors' ? (
        <div className="import-errors">
          <h3>{stage.name} was not installed</h3>
          <p>
            Nothing has been written. {stage.errors.length}{' '}
            {stage.errors.length === 1 ? 'problem' : 'problems'} in that file:
          </p>
          <ul>
            {stage.errors.slice(0, 12).map((error, index) => (
              <li key={index}>
                <span className="quiet">{error.chapter}</span> {error.message}
                {error.path ? <span className="quiet"> at {error.path}</span> : null}
              </li>
            ))}
          </ul>
          {stage.errors.length > 12 ? (
            <p className="hint">{stage.errors.length - 12} more not listed.</p>
          ) : null}
          <button type="button" onClick={() => setStage({ kind: 'idle' })}>
            Close
          </button>
        </div>
      ) : null}

      {stage.kind === 'confirm' ? (
        <div className="import-confirm">
          <h3>You already have {stage.course.title}</h3>
          <p>
            {stage.total === 0 ? (
              <>You have not marked any lines of it learnt, so there is nothing to lose.</>
            ) : (
              <>
                Replacing it keeps <strong>{stage.kept}</strong> of your {stage.total} learnt{' '}
                {stage.total === 1 ? 'line' : 'lines'}.{' '}
                {stage.kept < stage.total
                  ? 'The rest have moves this version does not have, so they would be forgotten.'
                  : 'Every one of them is still in the new version.'}
              </>
            )}
          </p>
          <div className="import-buttons">
            <button
              type="button"
              onClick={() => void write(stage.manifest, stage.files, stage.course)}
            >
              Replace it
            </button>
            <button type="button" onClick={() => setStage({ kind: 'idle' })}>
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      {stage.kind === 'done' ? (
        <div className="import-done">
          <p>{stage.message}</p>
          <button type="button" onClick={() => setStage({ kind: 'idle' })}>
            Close
          </button>
        </div>
      ) : null}
    </div>
  )
}

function message(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

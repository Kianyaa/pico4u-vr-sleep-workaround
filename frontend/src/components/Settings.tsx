import { Button, TextField, DropdownSelector, DropdownMenuItem, Checkbox } from '@charcoal-ui/react'
import { useState } from 'react'
import { useAppContext } from '../context/AppContext'
import { formatErrorLog } from '../lib/errors'

// The form copies the config into local state on mount, so it must not mount
// before the config has loaded, or Apply would save the defaults over it.
export function Settings({ onClose }: { onClose?: () => void }) {
  const { t, configLoaded } = useAppContext()
  if (!configLoaded) {
    return <p className='text-sm text-[var(--app-text-muted)]'>{t('status_checking')}</p>
  }
  return <SettingsForm onClose={onClose} />
}

function SettingsForm({ onClose }: { onClose?: () => void }) {
  const {
    t,
    i18n,
    changeLanguage,
    dimAfterHours,
    updateDimDelay,
    keepAwakeInterval,
    updateKeepAwakeInterval,
    isDebug,
    toggleDebugMode,
    theme,
    setTheme,
    isRunning,
    connectionMode,
    disableWirelessAdb,
  } = useAppContext()

  // resolvedLanguage is 'en' or 'ja'; i18n.language can be e.g. 'en-US' and match no option.
  const currentLanguage = i18n.resolvedLanguage ?? 'en'
  const [pendingLanguage, setPendingLanguage] = useState(currentLanguage)
  const [pendingTheme, setPendingTheme] = useState(theme)
  const [pendingDimAfterHours, setPendingDimAfterHours] = useState(String(dimAfterHours))
  const [pendingInterval, setPendingInterval] = useState(String(keepAwakeInterval))
  const [pendingDebug, setPendingDebug] = useState(isDebug)
  const [error, setError] = useState<string | null>(null)
  const [disabling, setDisabling] = useState(false)

  const handleApply = async () => {
    // Same limits as AppConfig::validate in src/config.rs.
    const dim = Number(pendingDimAfterHours)
    const interval = Number(pendingInterval)
    if (pendingDimAfterHours.trim() === '' || !Number.isFinite(dim) || dim < 0 || dim > 168) {
      setError(t('settings_invalid_dim'))
      return
    }
    if (!Number.isInteger(interval) || interval < 1 || interval > 3600) {
      setError(t('settings_invalid_interval'))
      return
    }
    setError(null)
    try {
      if (pendingLanguage !== currentLanguage) {
        changeLanguage(pendingLanguage)
      }
      if (pendingTheme !== theme) {
        setTheme(pendingTheme as any)
      }
      if (dim !== dimAfterHours) {
        await updateDimDelay(dim)
      }
      if (interval !== keepAwakeInterval) {
        await updateKeepAwakeInterval(interval)
      }
      if (pendingDebug !== isDebug) {
        await toggleDebugMode(pendingDebug)
      }
      onClose?.()
    } catch (e) {
      setError(t('settings_save_failed', { detail: String(e) }))
    }
  }

  const handleDisableWireless = async () => {
    if (!window.confirm(t('confirm_disable_wireless'))) return
    setDisabling(true)
    const err = await disableWirelessAdb()
    setDisabling(false)
    if (err) setError(formatErrorLog(err, t))
    else onClose?.()
  }

  const handleCancel = () => {
    onClose?.()
  }

  return (
    <div className='flex flex-col w-full'>
      <div className='flex flex-col gap-6 pb-6'>
        <div>
          <DropdownSelector
            label={t('language_label')}
            value={pendingLanguage}
            onChange={(val) => setPendingLanguage(val)}
            className='w-full'
            showLabel
          >
            <DropdownMenuItem value='ja'>日本語</DropdownMenuItem>
            <DropdownMenuItem value='en'>English</DropdownMenuItem>
          </DropdownSelector>
        </div>

        <div>
          <DropdownSelector
            label={t('theme_label')}
            value={pendingTheme}
            onChange={(val) => setPendingTheme(val as any)}
            className='w-full'
            showLabel
          >
            <DropdownMenuItem value='light'>{t('theme_light')}</DropdownMenuItem>
            <DropdownMenuItem value='dark'>{t('theme_dark')}</DropdownMenuItem>
            <DropdownMenuItem value='system'>{t('theme_system')}</DropdownMenuItem>
          </DropdownSelector>
        </div>

        <div>
          <TextField
            label={t('dim_setting_label')}
            type='number'
            value={pendingDimAfterHours}
            onChange={(val) => setPendingDimAfterHours(val)}
            disabled={isRunning}
            assistiveText={isRunning ? t('settings_locked_running') : t('dim_setting_note')}
            className='w-full text-left'
            showLabel
          />
        </div>

        <div>
          <TextField
            label={t('keep_awake_interval_label')}
            type='number'
            value={pendingInterval}
            onChange={(val) => setPendingInterval(val)}
            disabled={isRunning}
            assistiveText={isRunning ? t('settings_locked_running') : t('keep_awake_interval_note')}
            className='w-full text-left'
            showLabel
          />
        </div>

        <div className='mt-0.5 text-sm font-bold text-[var(--app-text)]'>
          <Checkbox checked={pendingDebug} onChange={setPendingDebug}>
            {t('debug_mode')}
          </Checkbox>
        </div>

        {connectionMode === 'wireless' && !isRunning && (
          <div>
            <Button
              onClick={handleDisableWireless}
              disabled={disabling}
              variant='Default'
              fullWidth
            >
              {t('btn_disable_wireless')}
            </Button>
            <p className='mt-1 text-xs text-[var(--app-text-muted)]'>
              {t('disable_wireless_note')}
            </p>
          </div>
        )}
      </div>

      {error && (
        <p role='alert' className='mb-3 text-sm text-red-600 dark:text-red-300'>
          {error}
        </p>
      )}

      <div className='shrink-0 pt-4 flex flex-col gap-3 border-t border-[var(--app-border)] bg-[var(--app-card)]'>
        <Button onClick={handleApply} variant='Primary' fullWidth>
          {t('btn_apply_changes')}
        </Button>
        <Button onClick={handleCancel} variant='Default' fullWidth>
          {t('cancel')}
        </Button>
      </div>
    </div>
  )
}

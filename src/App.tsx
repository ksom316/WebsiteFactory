import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { AuthProvider } from './auth/AuthProvider'
import { RequireAuth } from './auth/RequireAuth'
import { UnsavedChangesProvider } from './navigation/UnsavedChangesProvider'
import { CreateProjectPage } from './pages/CreateProjectPage'
import { DashboardPage } from './pages/DashboardPage'
import { LoginPage } from './pages/LoginPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { ProjectDetailPage } from './pages/ProjectDetailPage'
import { ProjectsPage } from './pages/ProjectsPage'
import { SettingsPage } from './pages/SettingsPage'
import { TemplatePreviewPage } from './pages/TemplatePreviewPage'
import { TemplatesShowcasePage } from './pages/TemplatesShowcasePage'
import { ThemeProvider } from './theme/ThemeProvider'

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <UnsavedChangesProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route element={<RequireAuth />}>
                {/* No AppShell here: the preview must render with zero dashboard chrome. */}
                <Route path="/templates/preview" element={<TemplatePreviewPage />} />
                <Route element={<AppShell />}>
                  <Route path="/" element={<DashboardPage />} />
                  <Route path="/projects" element={<ProjectsPage />} />
                  <Route path="/projects/new" element={<CreateProjectPage />} />
                  <Route path="/projects/:id" element={<ProjectDetailPage />} />
                  <Route path="/templates" element={<TemplatesShowcasePage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="*" element={<NotFoundPage />} />
                </Route>
              </Route>
            </Routes>
          </BrowserRouter>
        </UnsavedChangesProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App

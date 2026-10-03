import fs from 'fs'
import path from 'path'

describe('Hexo dashboard layout composition', () => {
  it('uses the shared app layout only once and hides its sidebar', () => {
    const source = fs.readFileSync(
      path.join(process.cwd(), 'themes/hexo/index.js'),
      'utf8'
    )
    const dashboardLayout = source.match(
      /const LayoutDashboard = ([\s\S]*?)\n\n/
    )?.[0]

    expect(source).toContain("router.pathname === '/dashboard/[[...index]]'")
    expect(dashboardLayout).toContain('<DashboardBody')
    expect(dashboardLayout).not.toContain('<LayoutBase')
  })
})

import { SiteFooter } from "@/components/site/site-footer"

export default function SlugLayout({ children }: LayoutProps<"/[slug]">) {
  return (
    <>
      <div className="flex-1">{children}</div>
      <SiteFooter />
    </>
  )
}

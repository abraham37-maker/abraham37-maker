import React from 'react'
import ThemeProvider from 'providers/ThemeProvider'

export const wrapRootElement = ({ element }) => (
  <ThemeProvider>{element}</ThemeProvider>
)

export const onRenderBody = ({ setHeadComponents }) => {
  setHeadComponents([
    <script
      key="tailwind-config"
      dangerouslySetInnerHTML={{
        __html: `tailwind.config = {\n  theme: {\n    extend: {\n      fontFamily: {\n        sans: ['Inter', 'ui-sans-serif', 'system-ui'],\n      },\n    },\n  },\n}`,\n      }}
    />,
    <script
      key="tailwind-cdn"
      src="https://cdn.tailwindcss.com"
    />,
    <link
      key="inter-font"
      rel="stylesheet"
      href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap"
    />,
  ])
}

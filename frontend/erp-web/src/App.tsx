import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 60 * 5, retry: 1 },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-blue-700 mb-2">Smart ERP</h1>
          <p className="text-gray-500">ERP Web Application — modules loading soon.</p>
        </div>
      </div>
    </QueryClientProvider>
  )
}
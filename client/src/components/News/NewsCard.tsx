import { Card } from '@/components/ui/card';
import { useAppSelector } from '@/lib/redux/hooks';
import { format } from 'date-fns';

export function NewsCard() {
  const { articles, loading, error } = useAppSelector(state => state.news);

  if (loading) {
    return (
      <Card className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
        <div className="p-5 bg-gradient-to-r from-violet-500 to-violet-600 text-white">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Crypto News</h3>
            <a href="#" className="text-white/80 hover:text-white text-sm flex items-center">
              More News
              <svg className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </div>
        </div>
        <div className="p-5 flex justify-center items-center h-64">
          <div className="animate-pulse space-y-4 w-full">
            <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-6 w-3/4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
        <div className="p-5 bg-gradient-to-r from-violet-500 to-violet-600 text-white">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Crypto News</h3>
          </div>
        </div>
        <div className="p-5 text-center">
          <p className="text-red-500 dark:text-red-400">Error loading news data: {error}</p>
          <button className="mt-4 px-4 py-2 bg-violet-500 text-white rounded-md hover:bg-violet-600">
            Retry
          </button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden" id="news-section">
      <div className="p-5 bg-gradient-to-r from-violet-500 to-violet-600 text-white">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Crypto News</h3>
          <a href="#" className="text-white/80 hover:text-white text-sm flex items-center">
            More News
            <svg className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </div>
      </div>
      
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {articles.length === 0 ? (
          <div className="p-5 text-center text-gray-500 dark:text-gray-400">
            No news articles available at the moment
          </div>
        ) : (
          articles.slice(0, 5).map((article) => (
            <a
              key={article.id}
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-5 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              {article.isBreaking && (
                <span className="text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 rounded-full px-2.5 py-0.5">
                  Breaking
                </span>
              )}
              <h4 className="font-semibold text-gray-900 dark:text-white mt-2">{article.title}</h4>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 line-clamp-2">
                {article.description}
              </p>
              <p className="text-gray-400 dark:text-gray-500 text-xs mt-2">
                {format(new Date(article.publishedAt), 'MMM d, yyyy')} • {article.source}
              </p>
            </a>
          ))
        )}
      </div>
    </Card>
  );
}

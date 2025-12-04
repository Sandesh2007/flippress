"use client"
import { Card, CardContent } from "@/components/ui/card"
import { NoPublications } from "@/layout/no-publications"
import { BarChart3, FileText, Heart, Calendar, ChartLine } from "lucide-react"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/database/supabase/client"
import { usePublications } from "@/components/common/PublicationsContext"

interface LikeRow {
  publication_id: string;
  user_id: string;
}

export default function StatisticsPage() {
  const { publications, loading } = usePublications();
  const [likes, setLikes] = useState<Record<string, number>>({});
  const [totalLikes, setTotalLikes] = useState(0);
  const [averageLikes, setAverageLikes] = useState(0);

  // Fetch likes for publications
  useEffect(() => {
    const fetchLikes = async () => {
      if (!publications.length) return;

      const supabase = createClient();
      const pubIds = publications.map((p) => p.id);

      if (pubIds.length > 0) {
        try {
          const { data: allLikes, error } = await supabase
            .from('publication_likes')
            .select('publication_id, user_id')
            .in('publication_id', pubIds);

          if (error) {
            console.error('Error fetching likes:', error);
            return;
          }

          // Count likes per publication
          const likeMap: Record<string, number> = {};
          allLikes?.forEach((row: LikeRow) => {
            likeMap[row.publication_id] = (likeMap[row.publication_id] || 0) + 1;
          });

          setLikes(likeMap);

          // Calculate total and average likes
          const total = Object.values(likeMap).reduce((sum, count) => sum + count, 0);
          const average = publications.length > 0 ? Math.round(total / publications.length) : 0;

          setTotalLikes(total);
          setAverageLikes(average);
        } catch (err) {
          console.error('Error fetching likes:', err);
        }
      }
    };

    // Only fetch likes if we have publications and they're not loading
    if (!loading && publications.length > 0) {
      fetchLikes();
    }
  }, [publications, loading]);

  // Calculate statistics
  const totalPublications = publications.length;
  const thisMonthPublications = publications.filter(pub => {
    const pubDate = new Date(pub.created_at);
    const now = new Date();
    return pubDate.getMonth() === now.getMonth() && pubDate.getFullYear() === now.getFullYear();
  }).length;

  return (
    <div className="p-3 sm:p-6 lg:p-8">
      <section className="glass outline-primary outline-1 rounded-lg p-4 sm:p-6 lg:p-8 mb-6 lg:mb-8">
        <div className="flex items-center gap-2 mb-2">
          <ChartLine className="text-primary"/>
          <h1 className="text-2xl sm:text-3xl font-bold">Statistics</h1>
        </div>
        <p className="text-neutral-600 dark:text-neutral-300 mb-4">
          View your content performance and analytics.
        </p>
      </section>

      <section>
        <h2 className="text-lg sm:text-xl lg:text-2xl font-bold mb-4 lg:mb-6">Overview</h2>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="glass border border-neutral-300 dark:border-neutral-700">
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="animate-pulse">
                      <div className="h-8 bg-neutral-300 dark:bg-neutral-600 rounded mb-2"></div>
                      <div className="h-4 bg-neutral-300 dark:bg-neutral-600 rounded"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card className="glass outline-1 ">
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="flex justify-center mb-2">
                    <FileText className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold text-neutral-800 dark:text-neutral-100">{totalPublications}</h3>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">Total Publications</p>
                </div>
              </CardContent>
            </Card>
            <Card className="glass outline-1 ">
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="flex justify-center mb-2">
                    <Calendar className="w-6 h-6 text-green-500" />
                  </div>
                  <h3 className="text-2xl font-bold text-neutral-800 dark:text-neutral-100">{thisMonthPublications}</h3>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">This Month</p>
                </div>
              </CardContent>
            </Card>
            <Card className="glass outline-1 ">
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="flex justify-center mb-2">
                    <Heart className="w-6 h-6 text-red-500" />
                  </div>
                  <h3 className="text-2xl font-bold text-neutral-800 dark:text-neutral-100">{totalLikes}</h3>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">Total Likes</p>
                </div>
              </CardContent>
            </Card>
            <Card className="glass outline-1 ">
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="flex justify-center mb-2">
                    <BarChart3 className="w-6 h-6 text-orange-500" />
                  </div>
                  <h3 className="text-2xl font-bold text-neutral-800 dark:text-neutral-100">{averageLikes}</h3>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">Avg. Likes</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </section>

      {!loading && totalPublications > 0 ? (
        <section >
          <h2 className="text-lg sm:text-xl lg:text-2xl font-bold mb-4 lg:mb-6">Recent Publications</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {publications.slice(0, 6).map((pub) => (
              <Card key={pub.id} className="glass outline-1">
                <CardContent className="p-4">
                  <label htmlFor="title" className=" text-muted-foreground" >Title</label>
                  <h4 id="title" className="font-semibold text-neutral-800 dark:text-neutral-100 mb-2 line-clamp-2">{pub.title}</h4>

                  <label htmlFor="description" className="text-muted-foreground" >Description</label>
                  <p id="description" className="text-sm font-semibold text-neutral-900 dark:text-neutral-50 mb-3 line-clamp-2">{pub.description}</p>

                  <div className="flex justify-between items-center text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                    <span>{new Date(pub.created_at).toLocaleDateString()}</span>
                    <div className="flex items-center gap-1">
                      <Heart className="w-4 h-4 text-red-500" />
                      <span className="text-sm" >{likes[pub.id] || 0} likes</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      ):
      (
        <NoPublications/>
      )
    }
    </div>
  )
}

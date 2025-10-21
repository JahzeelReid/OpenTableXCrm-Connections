import React, { useEffect, useState } from "react";
import { Card, CardContent, Typography } from "@mui/material";

export default function PostList() {
  const [posts, setPosts] = useState([]);

  //   useEffect(() => {
  //     fetch("/api/posts")
  //       .then((res) => res.json())
  //       .then(setPosts);
  //   }, []);

  useEffect(() => {
    setPosts([
      {
        content:
          "<p><strong>Weekly Update:</strong> Our engagement is up 25%! 🎉</p>",
        image:
          "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=80",
      },
      {
        content:
          "<p>Don’t forget to check out our new <em>customer feedback tool</em> launched today!</p>",
        image:
          "https://images.unsplash.com/photo-1581093588401-22d7a5e7a3d1?auto=format&fit=crop&w=800&q=80",
      },
      {
        content:
          "<p>📢 <strong>Announcement:</strong> We’re expanding to new markets next quarter.</p>",
        image:
          "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80",
      },
      {
        content:
          "<p>Client spotlight: Congrats to <strong>BlueWave Co.</strong> on 10,000 new signups!</p>",
        image:
          "https://images.unsplash.com/photo-1556761175-4b46a572b786?auto=format&fit=crop&w=800&q=80",
      },
      {
        content:
          "<p><em>Tip of the week:</em> Schedule your posts for maximum engagement between 6–9 PM.</p>",
        image:
          "https://images.unsplash.com/photo-1521747116042-5a810fda9664?auto=format&fit=crop&w=800&q=80",
      },
    ]);
  }, []);

  return (
    <>
      <Typography variant="h5" gutterBottom>
        Previous Posts
      </Typography>
      {posts.map((post, index) => (
        <Card key={index} sx={{ mb: 2 }}>
          <CardContent>
            <Typography
              variant="h6"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
            {post.image && (
              <img
                src={post.image}
                alt="Post"
                style={{
                  width: "100%",
                  marginTop: "10px",
                  borderRadius: "8px",
                }}
              />
            )}
          </CardContent>
        </Card>
      ))}
    </>
  );
}

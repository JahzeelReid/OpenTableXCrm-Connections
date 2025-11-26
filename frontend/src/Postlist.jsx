import React, { use, useEffect, useState } from "react";
import { Card, CardContent, Typography } from "@mui/material";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function PostList() {
  const [posts, setPosts] = useState([]);
  const navigate = useNavigate();

  //   useEffect(() => {
  //     fetch("/api/posts")
  //       .then((res) => res.json())
  //       .then(setPosts);
  //   }, []);

  function fetchPosts() {
    axios({
      method: "GET",
      url: `/api/posts`,
      data: {},
    })
      .then((response) => {
        setPosts(response.data.posts);
      })
      .catch((error) => {
        if (error.response && error.response.status === 401) {
          console.warn("Session expired or invalid token.");
          localStorage.removeItem("token"); // optional: clear stored token
          navigate("/");
        } else {
          console.log(error.response);
          console.log(error.response.status);
          console.log(error.response.headers);
        }
      });
  }

  useEffect(() => {
    fetchPosts();
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

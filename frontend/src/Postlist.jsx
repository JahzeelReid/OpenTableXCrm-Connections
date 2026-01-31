import React, { use, useEffect, useState, useMemo } from "react";
import { Card, CardContent, Typography } from "@mui/material";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "./authContext";

export default function PostList(props) {
  const [posts, setPosts] = useState([]);
  const navigate = useNavigate();
  const { token, authReady } = useContext(AuthContext);

  //   useEffect(() => {
  //     fetch("/api/posts")
  //       .then((res) => res.json())
  //       .then(setPosts);
  //   }, []);

  function fetchPosts() {
    axios({
      method: "GET",
      url: `${props.url}/api/posts`,
      headers: {
        Authorization: `Bearer ${token}`,
      },
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

  // const formattedPosts = useMemo(() => {
  //   return posts.map((post) => ({
  //     ...post,
  //     formattedDate: new Date(post.created_at).toLocaleString([], {
  //       weekday: "short",
  //       year: "numeric",
  //       month: "short",
  //       day: "numeric",
  //       hour: "2-digit",
  //       minute: "2-digit",
  //       timeZoneName: "short",
  //     }),
  //   }));
  // }, [posts]);

  const formattedPosts = useMemo(() => {
    return posts.map((post) => {
      // Ensure we have a valid date object
      const date = new Date(post.created_at);

      return {
        ...post,
        formattedDate: isNaN(date.getTime())
          ? "Invalid Date"
          : date.toLocaleString(undefined, {
              // 'undefined' uses the browser's default locale
              weekday: "short",
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              timeZoneName: "short",
            }),
      };
    });
  }, [posts]);

  useEffect(() => {
    if (!authReady) return;
    if (!token) return;
    fetchPosts();
  }, [authReady, token]);

  return (
    <>
      <Typography
        variant="h6"
        color="primary"
        sx={{ mb: 2, fontWeight: "bold" }}
        gutterBottom
      >
        Previous Posts
      </Typography>
      {formattedPosts.map((post, index) => (
        <Card
          key={index}
          sx={{
            mb: 2,
            position: "relative",
            boxShadow: `
                      0 1px 0 rgba(255,255,255,0.06),
                      0 10px 5px rgba(0,0,0,0.75)`,

            transition: "all 0.25s ease",
            "&:hover": {
              transform: "translateY(-3px)",
              boxShadow: `
                      0 1px 0 rgba(255,255,255,0.08),
                      0 15px 20px rgba(0,0,0,0.85)
                    `,
            },
          }}
        >
          <CardContent>
            <Typography
              variant="caption"
              sx={{
                position: "absolute",
                top: 8,
                right: 12,
                color: "text.secondary",
              }}
            >
              {post.formattedDate}
            </Typography>
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

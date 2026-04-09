'use client';

import React from 'react';

const VideoSection = () => {
  return (
    <>
      <div className="container">
        <div className="cs_parallax">
          <a
            className="cs_video_block cs_style1 cs_video_open cs_bg cs_parallax_bg"
            href="https://www.youtube.com/watch?v=zE_WFiHnSlY"
            target="_blank"
            rel="noopener noreferrer"
            style={{ backgroundImage: 'url(/assets/img/video_block.jpg)', cursor: 'pointer' }}
          >
            <span className="cs_player_btn cs_accent_color">
              <span></span>
            </span>
          </a>
        </div>
      </div>
      <div className="cs_height_150 cs_height_lg_60"></div>
    </>
  );
};

export default VideoSection;

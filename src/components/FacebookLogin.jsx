import React, { useEffect, useState } from 'react';

const App = () => {
  const [profile, setProfile] = useState(null);
  const [isLogin, setIsLogin] = useState(false);
  const [pages, setPages] = useState([]);
  const [selectedPage, setSelectedPage] = useState(null);
  const [pageDetails, setPageDetails] = useState(null);
  const [errorFetching, setErrorFetching] = useState(false);

  useEffect(() => {
    window.fbAsyncInit = function () {
      window.FB.init({
        appId: import.meta.env.VITE_APP_ID,
        cookie: true,
        xfbml: true,
        version: 'v14.0',
      });

      window.FB.AppEvents.logPageView();
    };

    (function (d, s, id) {
      var js, fjs = d.getElementsByTagName(s)[0];
      if (d.getElementById(id)) return;
      js = d.createElement(s); js.id = id;
      js.src = 'https://connect.facebook.net/en_US/sdk.js';
      fjs.parentNode.insertBefore(js, fjs);
    })(document, 'script', 'facebook-jssdk');
  }, []);

  const handleLogin = () => {
    window.FB.login(
      (response) => {
        if (response.authResponse) {
          console.log('Welcome! Fetching your information...');
          window.FB.api('/me', { fields: 'name,picture,email' }, function (response) {
            setProfile(response);
            console.log("profile", response);
            fetchPages();
          });
        } else {
          console.log('User cancelled login or did not fully authorize.');
        }
      },
      { scope: 'public_profile,email,pages_show_list,pages_read_engagement,read_insights' }
    );
  };

  const fetchPages = () => {
    window.FB.api('/me/accounts', function (response) {
      setPages(response.data);
      console.log("page is ",response.data);
    });
  };

  const handlePageSelect = (event) => {
    if (event.target.value == 0) {
      return
    }
    console.log("id", event.target.value);
    setSelectedPage(event.target.value);
    const selectedPageToken = event.target.options[event.target.selectedIndex].getAttribute('data-token');
    const data = { pageId: event.target.value, selectedPageToken };
    fetchPageDetails(data);
  };

  const fetchPageDetails = (data) => {
    let { pageId, selectedPageToken } = data;
    const url = `/${pageId}/insights?metric=page_fans,page_post_engagements,page_impressions,page_actions_post_reactions_total&access_token=${selectedPageToken}`;

    window.FB.api(
      url,
      function (response) {
        console.log("url", url);
        console.log("response", response);
        if (response.error) {
          console.error(response.error.message);
        } else {
          const latestEngagement = response.data.find((item) => item.name === 'page_post_engagements')?.values[0]?.value || 0;
          const latestImpressions = response.data.find((item) => item.name === 'page_impressions')?.values[0]?.value || 0;
          const latestReactions = response.data.find((item) => item.name === 'page_actions_post_reactions_total')?.values[0]?.value.like || 0;
          const latestFans = response.data.find((item) => item.name === 'page_fans')?.values[0]?.value || 0;

          const details = {
            engagement: latestEngagement,
            impressions: latestImpressions,
            reactions: latestReactions,
            fans: latestFans,
          };
          setPageDetails(details);
          console.log("pagedetails", details);
        }
      }
    );
  };



  const handleLogout = () => {
    window.FB.logout((response) => {
      setProfile(null);
      setPages([]);
      setSelectedPage('');
      setPageDetails(null);
      setErrorFetching(false);
      setIsLogin(false)
    });
  };

  return (
    <div className={`flex flex-col ${isLogin ? '' : 'justify-center'} items-center bg-blue-300 h-fit min-h-screen w-full text-black`}>
      <div className={`flex ${!isLogin ? 'flex-col ' : 'flex-row'} justify-between w-screen px-8 mb-8 ${isLogin ? 'border-b-2' : ''}`}>
        <h1 className='text-4xl text-black font-semibold py-6 px-4'>Facebook Login and Page Insights</h1>
        {!profile ? (
          <button
            className='bg-blue-500 w-fit h-16 ms-4 py-3 px-4 rounded-md uppercase font-bold text-2xl'
            onClick={handleLogin}
          >
            Login with Facebook
          </button>
        ) : (
          <button
            className='bg-red-500 w-40 h-16 my-auto rounded-md uppercase font-bold text-2xl'
            onClick={handleLogout}
          >
            Logout
          </button>
        )}
      </div>
      {profile && (
        <div className='text-center'>
          <div className='flex '>
            <img className='w-40 h-40 rounded-full border-2 border-black object-cover' src={profile.picture.data.url} alt='Profile' />
            <div className='text-left ms-10 mt-5'>
              <p className='text-3xl'>Welcome, <span className='font-bold'>{profile.name}</span></p>
              <p className='text-3xl'>Email: {profile.email}</p>
              <p className='text-3xl flex flex-row items-center'>Select Page : {pages.length > 0 && (
                <select onChange={handlePageSelect} value={selectedPage} className='bg-blue-400 border-slate-500 border-2 rounded-md'>
                  <option value={0}>Select a Page</option>
                  {pages.map((page) => (
                    <option key={page.id} value={page.id} data-token={page.access_token}>
                      {page.name}
                    </option>
                  ))}
                </select>
              )}
              </p>
            </div>
          </div>
        </div>
      )}
      {errorFetching && (
        <h3 className='text-2xl text-red-600 mt-4 p-6'>No insights data found for the specified metrics and period.</h3>
      )}
      {pageDetails && !errorFetching && (
        <div className='mt-4 grid'>
          <div className='border-2 rounded-md p-4 flex flex-row m-1'>
            <h3>Total Followers / Fans:  </h3>
            <p>{pageDetails.fans}</p>
          </div>
          <div className='border-2 rounded-md p-4 flex flex-row m-1'>
            <h3>Total Engagement:  </h3>
            <p>{pageDetails.engagement}</p>
          </div>
          <div className='border-2 rounded-md p-4 flex flex-row m-1'>
            <h3>Total Impressions:  </h3>
            <p>{pageDetails.impressions}</p>
          </div>
          <div className='border-2 rounded-md p-4 flex flex-row m-1'>
            <h3>Total Reactions:  </h3>
            <p>{pageDetails.reactions}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;

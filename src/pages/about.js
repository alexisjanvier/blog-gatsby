import Helmet from 'react-helmet';
import React from 'react';
import Gravatar from 'react-gravatar';

export default () => (
    <div>
        <Helmet>
            <title>alexisjanvier.net - about</title>
        </Helmet>
        <Gravatar email="alexis@marmelab.com" size={100} />
    </div>
);

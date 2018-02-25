import Helmet from 'react-helmet';
import React from 'react';
import Gravatar from 'react-gravatar';

const imgStyle = {
    borderRadius: '50%'
};

export default () => (
    <div>
        <Helmet>
            <title>alexisjanvier.net - about</title>
        </Helmet>
        <p><Gravatar style={imgStyle} email="alexis@marmelab.com" size={100} />
        Sensibilisé très tôt à l’informatique grâce au ZX81 de mon père, j’ai pourtant suivi des études de biologie et commencé à travailler dans la médiation scientifique. Mais j’ai découvert en 2002 mon terrain de jeu favori : le web.</p>

        <p>Après un passage par la case freelance, j’ai continué ma carrière comme programmeur Php au sein de plusieurs entreprises, puis comme directeur technique au sein d’une <a href="https://www.plemi.com/">startup</a>, pour devenir Lead Dev Php en <a href="http://www.rapp.com/">agence</a>.</p>

        <p>Aujourd’hui, j’ai le grand plaisir d’exercer mon métier de développeur au sein de <a href="https://marmelab.com/">Marmelab</a>, depuis Caen où quand ma famille, le travail, la mer et l’équitation me laissent du temps, je participe à l’organisation des <a href="https://www.caencamp.fr">CaenCamp</a>.</p>
    </div>
);

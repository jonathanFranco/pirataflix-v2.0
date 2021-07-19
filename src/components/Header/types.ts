export type Props = {
    props?:any
}

export const navigation = [
    { name: 'Home', to: '/home', current: true },
    { name: 'Filmes', to: '/filmes', current: false },
    { name: 'Séries', to: '/series', current: false },
];

export const dropdown = [
    {name:'Minha Lista', to:'/minha-lista',active: false},
]
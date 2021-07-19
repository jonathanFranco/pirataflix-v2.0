export type Props = {
  props?: {
    key: number;
    date: any;
    backdrop_path: string;
    title: string;
    vote_average: any;
    runtime: string;
    tagline: string;
    sinopse: string;
    isSalvo?: boolean;
    salvarItem: (event: any) => void;
  };
};

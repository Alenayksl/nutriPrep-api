export interface Category{
    id: string;
    name: string;
    description: string;
}

export let categories: Category[] = [
{
    id: "1",
    name: "Kahvaltılıklar",
    description: "Güne enerjik başlamak için sağlıklı kahvaltı tarifleri"
},
{
    id: "2",
    name: "Yüksek Protein",
    description: "Spor sonrası kas onarımı için protein ağırlıklı öğünler."
  }
];
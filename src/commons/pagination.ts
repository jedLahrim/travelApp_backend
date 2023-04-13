export class Pagination<T> {
  list: T[];
  total: number;

  constructor(list: T[], total: number) {
    this.list = list;
    this.total = total;
  }
}

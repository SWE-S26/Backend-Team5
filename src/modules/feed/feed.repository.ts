export class FeedRepository {
  async findAll(): Promise<any[]> {
    // TODO: query your data source
    return [];
  }

  async findById(id: string): Promise<any | null> {
    // TODO: query your data source
    return null;
  }

  async create(data: any): Promise<any> {
    // TODO: insert into your data source
    return data;
  }

  async update(id: string, data: any): Promise<any | null> {
    // TODO: update in your data source
    return null;
  }

  async delete(id: string): Promise<boolean> {
    // TODO: delete from your data source
    return false;
  }
}

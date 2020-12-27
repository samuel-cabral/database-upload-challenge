import { getRepository, getCustomRepository } from 'typeorm';

import AppError from '../errors/AppError';
import TransactionsRepository from '../repositories/TransactionsRepository';
import Transaction from '../models/Transaction';
import Category from '../models/Category';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category,
  }: Request): Promise<Transaction> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);

    const { total } = await transactionsRepository.getBalance();

    if (!['income', 'outcome'].includes(type)) {
      throw new Error('Invalid transaction type');
    }

    if (type === 'outcome' && value > total) {
      throw new AppError('Your balance is insufficient for this transaction!');
    }

    const categoriesRepository = getRepository(Category);

    const categoryAlreadyExists = await categoriesRepository.findOne({
      where: {
        title: category,
      },
    });

    if (categoryAlreadyExists) {
      const transaction = transactionsRepository.create({
        title,
        value,
        type,
        category: categoryAlreadyExists,
      });

      await transactionsRepository.save(transaction);

      return transaction;
    }

    const transactionCategory = categoriesRepository.create({
      title: category,
    });

    await categoriesRepository.save(transactionCategory);

    const transaction = transactionsRepository.create({
      title,
      value,
      type,
      category: transactionCategory,
    });

    await transactionsRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
